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
  const { firestore, user, isUserLoading, auth } = useFirebase();

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const awayCounterRef = useRef(0);
  const lastFirestoreUpdateRef = useRef(0);
  const mainIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const auditIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
    if (auditIntervalRef.current) clearInterval(auditIntervalRef.current);
    
    webcamStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());

    if(webcamVideoRef.current) webcamVideoRef.current.srcObject = null;
    if(screenVideoRef.current) screenVideoRef.current.srcObject = null;

    webcamStreamRef.current = null;
    screenStreamRef.current = null;
    mainIntervalRef.current = null;
    auditIntervalRef.current = null;
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
        setFocusState('focus');
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
  }, [screenVideoRef, addLog, updateFirestore, toast]);
  
  const detectFace = useCallback(() => {
    if (!faceLandmarkerRef.current || !webcamVideoRef.current || webcamVideoRef.current.readyState < 2) return;
    
    const video = webcamVideoRef.current;
    if (video.currentTime === lastVideoTimeRef.current) return;
    lastVideoTimeRef.current = video.currentTime;

    try {
      const results = faceLandmarkerRef.current.detectForVideo(video, Date.now());

      if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
        awayCounterRef.current = 0;
        if (status === 'paused') {
          setStatus('running');
          setFocusState('focus');
          addLog('Away', 'User returned to screen', 0); // Duration to be calculated
        }
      } else {
        awayCounterRef.current++;
        if (awayCounterRef.current >= AWAY_THRESHOLD && status === 'running') {
          setStatus('paused');
          setFocusState('away');
          addLog('Away', 'User left the screen', awayCounterRef.current);
        }
      }
    } catch (e) {
      console.error("Error during face detection:", e);
    }
  }, [status, addLog, webcamVideoRef]);

  const mainLoop = useCallback(() => {
    if(status === 'running') {
      setTime(prev => prev + 1);
    }
    detectFace();
  }, [status, detectFace]);
  
  const initializeMediaPipe = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU",
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
      toast({ title: 'Privacy Shield is on', description: 'Please disable it to start a session.' });
      return;
    }

    if (isUserLoading || !auth || !user) {
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
      setStatus('running');
      setFocusState('focus');

      mainIntervalRef.current = setInterval(mainLoop, 1000);
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
  }, [enabled, toast, cleanup, mainLoop, runScreenAudit, initializeMediaPipe, webcamVideoRef, screenVideoRef, firestore, user, isUserLoading, auth]);

  const endSession = useCallback(async () => {
    if (!sessionId || !user || !firestore) return;
    
    cleanup();
    
    const finalLogs = logs.map(l => ({...l, timestamp: new Date(l.timestamp).getTime()}));

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
