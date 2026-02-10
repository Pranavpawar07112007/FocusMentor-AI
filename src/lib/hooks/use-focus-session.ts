import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import {
  collection,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { analyzeScreenActivity } from '@/ai/flows/analyze-screen-activity';
import { summarizeStudySession } from '@/ai/flows/summarize-study-session';
import type { SessionStatus, FocusState, LogEntry, StudySession, ActivityCategory } from '@/types';
import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const AWAY_THRESHOLD = 3; // seconds
const AUDIT_INTERVAL = 120 * 1000; // 2 minutes in milliseconds
const FIRESTORE_UPDATE_INTERVAL = 15 * 1000; // 15 seconds

type UseFocusSessionProps = {
  enabled: boolean;
  webcamVideoRef: React.RefObject<HTMLVideoElement>;
  screenVideoRef: React.RefObject<HTMLVideoElement>;
};

export function useFocusSession({
  enabled,
  webcamVideoRef,
  screenVideoRef,
}: UseFocusSessionProps) {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [focusState, setFocusState] = useState<FocusState>('focus');
  const [time, setTime] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);

  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const animationFrameIdRef = useRef<number | null>(null);
  const awayStartTimeRef = useRef<number | null>(null);
  const lastFaceSeenTimeRef = useRef<number>(0);
  const lastFirestoreUpdateRef = useRef(0);
  const auditIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (auditIntervalRef.current) clearInterval(auditIntervalRef.current);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    webcamStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());

    if(webcamVideoRef.current) webcamVideoRef.current.srcObject = null;
    if(screenVideoRef.current) screenVideoRef.current.srcObject = null;

    webcamStreamRef.current = null;
    screenStreamRef.current = null;
    auditIntervalRef.current = null;

    if (faceLandmarkerRef.current) {
      faceLandmarkerRef.current.close();
      faceLandmarkerRef.current = null;
    }
  }, [webcamVideoRef, screenVideoRef]);

  const addLog = useCallback((category: ActivityCategory, reasoning: string, duration: number) => {
    const newLog: LogEntry = {
      id: `${Date.now()}`,
      timestamp: Date.now(),
      category,
      reasoning,
      duration,
    };
    setLogs(prevLogs => [...prevLogs, newLog]);
    return newLog;
  }, []);

  const updateFirestore = useCallback(async (newLogs: LogEntry[], force = false) => {
    if (!sessionId || !user || !firestore) return;
    const now = Date.now();
    if (!force && now - lastFirestoreUpdateRef.current < FIRESTORE_UPDATE_INTERVAL) {
      return;
    }

    const sessionRef = doc(firestore, 'users', user.uid, 'study_sessions', sessionId);
    updateDocumentNonBlocking(sessionRef, {
      totalFocusTime: time,
      logs: logs.concat(newLogs),
    });
    lastFirestoreUpdateRef.current = now;
  }, [sessionId, time, logs, user, firestore]);

  const runScreenAudit = useCallback(async () => {
    if (!screenVideoRef.current || screenVideoRef.current.readyState < 2) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = screenVideoRef.current.videoWidth;
    canvas.height = screenVideoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(screenVideoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');

    try {
      const result = await analyzeScreenActivity({ photoDataUri: dataUri });
      if (result.category === 'Distraction') {
        setFocusState('distraction');
      } else {
        // If not distracted, and user is present, state is focus
        if (status === 'running') {
          setFocusState('focus');
        }
      }
      const newLog = addLog(result.category, result.reasoning, AUDIT_INTERVAL / 1000);
      updateFirestore([newLog]);
    } catch (error) {
      console.error('AI screen audit failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Screen Audit Error',
        description: 'Could not analyze screen activity.',
      });
    }
  }, [screenVideoRef, addLog, updateFirestore, toast, status]);

  const predictWebcam = useCallback(() => {
    const video = webcamVideoRef.current;

    if (!faceLandmarkerRef.current) {
        return;
    }
    if (!video || video.readyState !== 4 || video.videoWidth === 0) {
        return;
    }
    
    const timestamp = video.currentTime * 1000;
    if (timestamp === lastVideoTimeRef.current) {
        return;
    }
    lastVideoTimeRef.current = timestamp;

    try {
        const results = faceLandmarkerRef.current.detectForVideo(video, timestamp);

        if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
            lastFaceSeenTimeRef.current = Date.now();
            if (status === 'paused' && awayStartTimeRef.current) {
                const awayDuration = Math.round((Date.now() - awayStartTimeRef.current) / 1000);
                addLog('Away', `User returned after ${awayDuration}s`, awayDuration);
                awayStartTimeRef.current = null;
                setStatus('running');
                setFocusState('focus');
            }
        } else {
            if (status === 'running' && !awayStartTimeRef.current) {
                if (Date.now() - lastFaceSeenTimeRef.current > AWAY_THRESHOLD * 1000) {
                    setStatus('paused');
                    setFocusState('away');
                    awayStartTimeRef.current = Date.now();
                }
            }
        }
    } catch (e) {
        console.error("Error during face detection:", e);
    }
  }, [status, webcamVideoRef, addLog]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (status === 'running') {
      timerId = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [status]);
  
  useEffect(() => {
    const loop = () => {
      predictWebcam();
      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    if (status === 'running' || status === 'paused') {
      animationFrameIdRef.current = requestAnimationFrame(loop);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [status, predictWebcam]);
  
  const initializeMediaPipe = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "CPU",
        },
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        runningMode: "VIDEO",
        numFaces: 1,
      });
      faceLandmarkerRef.current = landmarker;
    } catch(e) {
      console.error("Failed to initialize MediaPipe", e);
      toast({
        variant: 'destructive',
        title: 'Initialization Error',
        description: 'Could not load face detection model.',
      });
      setStatus('idle');
    }
  }, [toast]);
  
  const startSession = useCallback(async () => {
    if (!enabled) {
      toast({ title: 'Privacy Shield is on or you are not logged in.', description: 'Please disable it and log in to start a session.' });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be signed in to start a session.',
      });
      return;
    }
    
    setStatus('initializing');
    setSessionSummary(null);

    try {
      if(!faceLandmarkerRef.current) {
        await initializeMediaPipe();
        if(!faceLandmarkerRef.current) throw new Error("FaceLandmarker not initialized");
      }

      const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      webcamStreamRef.current = webcamStream;
      if (webcamVideoRef.current) webcamVideoRef.current.srcObject = webcamStream;

      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = screenStream;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = screenStream;
      
      const newSession: Omit<StudySession, 'id'> = {
        userId: user.uid,
        startTime: Timestamp.now(),
        endTime: null,
        totalFocusTime: 0,
        status: 'active',
        logs: [],
      };
      
      if (!firestore) throw new Error("Firestore not available");

      const sessionCollection = collection(firestore, 'users', user.uid, 'study_sessions');
      const docRef = await addDocumentNonBlocking(sessionCollection, newSession);
      
      setSessionId(docRef.id);
      setTime(0);
      setLogs([]);
      
      lastFaceSeenTimeRef.current = Date.now();
      awayStartTimeRef.current = null;
      
      setStatus('running');
      setFocusState('focus');

      auditIntervalRef.current = setInterval(runScreenAudit, AUDIT_INTERVAL);

    } catch (err) {
      console.error('Failed to start session:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to start session',
        description: 'Please ensure you grant camera and screen permissions.',
      });
      cleanup();
      setStatus('idle');
    }
  }, [enabled, toast, cleanup, runScreenAudit, initializeMediaPipe, webcamVideoRef, screenVideoRef, firestore, user]);

  const endSession = useCallback(async () => {
    if (!sessionId || !user || !firestore) return;

    const finalLogs = [...logs];
    if (awayStartTimeRef.current !== null) {
      const awayDuration = Math.round((Date.now() - awayStartTimeRef.current) / 1000);
      finalLogs.push({
        id: `${Date.now()}`,
        timestamp: Date.now(),
        category: 'Away',
        reasoning: `Session ended while user was away for ${awayDuration}s`,
        duration: awayDuration,
      });
    }
    
    cleanup();
    
    try {
      const summaryResult = await summarizeStudySession({ logs: finalLogs });
      setSessionSummary(summaryResult.summary);
    } catch(e) {
      console.error("Error summarizing session", e);
    }
    
    const sessionRef = doc(firestore, 'users', user.uid, 'study_sessions', sessionId);
    updateDocumentNonBlocking(sessionRef, {
      endTime: serverTimestamp(),
      status: 'completed',
      totalFocusTime: time,
      logs: finalLogs,
    });
    
    setStatus('stopped');
  }, [sessionId, cleanup, time, logs, firestore, user]);
  
  useEffect(() => {
    return () => {
      if(status === 'running' || status === 'paused') {
        endSession();
      }
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, time, logs, startSession, endSession, focusState, sessionSummary };
}
