import { RECORDING_NOTE } from "../lib/constants";

// Shown on every proposal page. The data-recording-note marker is what the capstone check looks for,
// so you may reword RECORDING_NOTE in lib/constants.ts freely.
export default function RecordingNote() {
  return (
    <p className="recording-note" data-recording-note>
      {RECORDING_NOTE}
    </p>
  );
}
