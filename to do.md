I am done investigating mediapipe, and I found the root cause of the crash.

The script liveness_detector.py is trying to use the legacy mp.solutions.face_mesh API. However, in the newer versions of mediapipe (like the 0.10.33 installed in your environment), Google has completely removed the legacy solutions module and replaced it with a new tasks API.

Because you are likely using a newer version of Python (like 3.11 or 3.12), the older versions of mediapipe that still have the solutions module aren't available to be installed via pip.

To fix the AI Service, we have two options:

Option 1: I can rewrite the liveness_detector.py file for you right now to use the new modern mediapipe.tasks.python.vision.FaceLandmarker API. (This is the best long-term fix).
Option 2: You can downgrade your Python version to 3.10, recreate the virtual environment, and install mediapipe==0.9.0.