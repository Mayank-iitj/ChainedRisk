from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.core.events import manager

router = APIRouter(tags=["websocket"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, receive ping / subscriptions
            data = await websocket.receive_text()
            # Echo or process subscription if needed
            await websocket.send_text('{"type": "ack"}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

