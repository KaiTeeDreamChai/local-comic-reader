import re
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse, StreamingResponse

from ..utils import decode_path

router = APIRouter(tags=["Video Streaming"])


@router.get("/api/video/stream")
def stream_video(request: Request, comic_id: str = Query(...)):
    """Stream video file with standard HTTP Range support (206 Partial Content) for smooth, non-stuttering playback."""
    try:
        file_path_str = decode_path(comic_id)
        target = Path(file_path_str)
        if not target.exists() or not target.is_file():
            raise HTTPException(status_code=404, detail="视频文件不存在")

        file_size = target.stat().st_size
        range_header = request.headers.get("range")
        ext = target.suffix.lower()

        # Determine media type
        content_type = "video/mp4"
        if ext == ".webm":
            content_type = "video/webm"
        elif ext == ".mkv":
            content_type = "video/x-matroska"
        elif ext == ".mov":
            content_type = "video/quicktime"
        elif ext == ".avi":
            content_type = "video/x-msvideo"
        elif ext == ".flv":
            content_type = "video/x-flv"
        elif ext == ".wmv":
            content_type = "video/x-ms-wmv"
        elif ext == ".ts":
            content_type = "video/mp2t"

        # If Range header is requested by video player
        if range_header:
            range_match = re.match(r"bytes=(\d+)-(\d*)", range_header)
            if range_match:
                start = int(range_match.group(1))
                end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
                end = min(end, file_size - 1)
                chunk_size = (end - start) + 1

                def iter_file():
                    with open(target, "rb") as f:
                        f.seek(start)
                        remaining = chunk_size
                        while remaining > 0:
                            read_len = min(64 * 1024, remaining)
                            data = f.read(read_len)
                            if not data:
                                break
                            remaining -= len(data)
                            yield data

                headers = {
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(chunk_size),
                    "Content-Type": content_type,
                }
                return StreamingResponse(iter_file(), status_code=206, headers=headers)

        # Non-range full file response
        return FileResponse(
            path=str(target),
            media_type=content_type,
            headers={"Accept-Ranges": "bytes", "Content-Length": str(file_size)}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
