# **App Name**: FocusMentor AI

## Core Features:

- Presence Detection: Utilize MediaPipe Face Landmarker to detect user presence. Pause the timer if no face is detected for 3 consecutive seconds. Fixes incorrect detections.
- AI Screen Auditor: Capture screen frames periodically and send them to the Gemini 1.5 Flash API tool for activity categorization (Coding, Mathematics, Academic Research, Distraction). Returns JSON object with the determined category and the reasoning.
- Study Session Logging: Store study session data in Firestore, including start time, end time, total focus time, and a log of AI categorizations with timestamps. Sync the timer state with Firestore in real-time to prevent data loss.
- Focus Ring Timer: Implement a circular progress bar that visually represents focus. It turns green when studying and pulses amber when away or distracted.
- Daily Statistics Dashboard: Display a bar chart with daily activity breakdowns (e.g., time spent on different subjects).
- Privacy Shield: Implement a prominent toggle that completely disables the camera and screen capture functionality.
- Real-time data synchronisation: Persist the current state in Firestore to survive refresh or browser restarts

## Style Guidelines:

- Primary color: Dark purple (#624CAB), creating a sophisticated feel.
- Background color: Very dark purple (#1A132F) complementing the primary and fitting with dark mode 'Glassmorphism' theme.
- Accent color: Light purple (#A392BF), used sparingly for focus ring.
- Font: 'Inter' sans-serif font for a clean and modern aesthetic, suitable for both headers and body.
- Code font: 'Source Code Pro' for displaying any code snippets in a monospaced font.
- Use minimalist icons to represent different study categories.
- Employ 'Glassmorphism' to create a frosted glass effect for panels and components.
- Smooth transitions and subtle animations when the focus state changes, indicating when the user is present or away.