document
  .getElementById("generate-audio")
  .addEventListener("click", async () => {
    document.getElementById("status").innerText = "Generating audio...";
    const text = document.getElementById("text").value;
    const response = await fetch("/api/generate-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    if (data.success) {
      document.getElementById("status").innerText = "✅ Audio generated!";
    }
    document.getElementById("audio").src = data.audioUrl;
  });

document
  .getElementById("generate-video")
  .addEventListener("click", async () => {
    document.getElementById("status").innerText = "Generating video...";
    const audioUrl = document.getElementById("audio").src;
    const response = await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl }),
    });
    const data = await response.json();

    if (data.success) {
      document.getElementById("video").src = data.video;
      document.getElementById("video").style.display = "block";
      document.getElementById("downloadBtn").style.display = "inline";
      document.getElementById("status").innerText = "✅ Video generated!";
    }
  });

document.getElementById("add-title").addEventListener("click", async () => {
  const title = document.getElementById("title-input").value;
  const videoUrl = document.getElementById("video-player").src;
  const response = await fetch("/api/add-title", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl, title }),
  });
  const data = await response.json();
  document.getElementById("video-player").src = data.finalVideoUrl;
});
