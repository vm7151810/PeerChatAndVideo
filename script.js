var something = document.getElementById('tri');
const pattern = trianglify({
    width: window.innerWidth,
    height: window.innerHeight,
    cellSize: 70,
    variance: 0.85,
    seed: 1,
    strokeWidth: 0.5,
  })
something.appendChild(pattern.toCanvas());

function joinRoom() {
  location.href = `/member.html`;
}

function createRoom() {
  location.href = `/host.html`;
}