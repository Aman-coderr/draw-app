import { useParams } from "react-router-dom";
import { RoomCanvas } from "../../components/RoomCanvas.js";
export default function CanvasPage() {
  const { roomId } = useParams();
  return <div>
    <RoomCanvas roomId={Number(roomId)} />
  </div>
}
