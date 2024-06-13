import "./App.css";
import bg from "./spiderman.jpg";

import { useState, useRef, useEffect } from "react";

function Tile({ url, size, n, x, y, style }) {
  const ref = useRef(null);

  const draw = (image) => {
    const canvas = ref.current;
    const context = canvas.getContext("2d");
    const imageSize = image.naturalHeight / n;

    canvas.height = size;
    canvas.width = size;
    context.drawImage(
      image,
      y * imageSize,
      x * imageSize,
      imageSize,
      imageSize,
      0,
      0,
      size,
      size,
    );

    context.fillStyle = "white";
    context.font = "bold 32px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(n * x + y + 1, canvas.width / 2, canvas.height / 2);
    context.strokeText(n * x + y + 1, canvas.width / 2, canvas.height / 2);
  };

  useEffect(() => {
    const image = new Image();
    image.src = url;

    image.onerror = function (e) {
      console.error(e);
      return function () { };
    };

    const drawImage = () => {
      console.info("Draw now");
      draw(image);
    };

    if (image.complete) {
      console.info("Already loaded");
      drawImage();
      return function () { };
    } else {
      console.info("Not loaded yet");
      image.addEventListener("load", drawImage);
      return function () {
        console.info("Cleanup load handler");
        image.removeEventListener("load", drawImage);
      };
    }
  });

  return <canvas id={"tile_" + x + "_" + y} ref={ref} style={style}></canvas>;
}

function generateInitialPos({ numSteps = 10, n }) {
  // todo geneate by n
  let pos = [
    [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [[2, 0], [2, 1], null],
  ];

  let holeX = n - 1;
  let holeY = n - 1;
  for (let i = 0; i < numSteps; i++) {
    let step = Math.floor(Math.random() * 4);
    let dx = 0;
    let dy = 0;
    switch (step) {
      case 0:
        dx = -1;
        break;
      case 1:
        dy = 1;
        break;
      case 2:
        dx = 1;
        break;
      case 3:
        dy = -1;
        break;
      default:
        return null;
    }

    let tileX = holeX - dx;
    let tileY = holeY - dy;

    if (tileX >= 0 && tileX < n && tileY >= 0 && tileY < n) {
      pos[holeX][holeY] = pos[tileX][tileY];
      pos[tileX][tileY] = null;
      holeX = tileX;
      holeY = tileY;
    } else {
      i--;
    }
  }

  return pos;
}

function Board({ n, size, margin = size / 20 }) {
  // Map from on-screen position to tiles
  const [pos, setPos] = useState(generateInitialPos({ n }));

  // [
  //   [null, [2, 0], [0, 2]],
  //   [
  //     [0, 0],
  //     [1, 0],
  //     [1, 2],
  //   ],
  //   [
  //     [2, 1],
  //     [1, 1],
  //     [0, 1],
  //   ],
  // ]

  const [hideTile, setHideTile] = useState(null);

  const tiles = [];

  let hideTileX;
  let hideTileY;
  if (hideTile !== null) {
    hideTileX = hideTile[0];
    hideTileY = hideTile[1];
  }

  let allCorrect = true;

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (pos[row][col] === null) {
        // Hole
        continue;
      }

      const [tileX, tileY] = pos[row][col];
      allCorrect = allCorrect && tileX === row && tileY === col;

      const style = {
        position: "absolute",
        // left: col * (size + margin),
        // top: row * (size + margin),
        transform: `translate(${col * (size + margin)}px, ${row * (size + margin)
          }px)`,
        display: tileX === hideTileX && tileY === hideTileY ? "none" : "inline",
      };

      tiles.push(
        <Tile
          style={style}
          key={tileX + "," + tileY}
          n={n}
          x={tileX}
          y={tileY}
          size={size}
          url={bg}
        />,
      );
    }
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (hideTile !== null) {
        // Still animating - don't start another
        return;
      }

      let deltaX = 0;
      let deltaY = 0;

      if (e.code === "ArrowUp") {
        deltaX++;
      } else if (e.code === "ArrowDown") {
        deltaX--;
      } else if (e.code === "ArrowLeft") {
        deltaY++;
      } else if (e.code === "ArrowRight") {
        deltaY--;
      } else {
        return;
      }

      let holeX;
      let holeY;
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          if (pos[row][col] === null) {
            holeX = row;
            holeY = col;
            break;
          }
        }

        if (holeX !== undefined) {
          break;
        }
      }

      console.info("Hole: " + holeX + "," + holeY);

      const targetX = holeX + deltaX;
      const targetY = holeY + deltaY;

      if (targetX < 0 || targetX >= n || targetY < 0 || targetY >= n) {
        return;
      }

      console.info("Target: " + targetX + "," + targetY);

      const tilePos = pos[targetX][targetY];
      setHideTile(tilePos);
      const tileElement = document.getElementById(
        "tile_" + tilePos[0] + "_" + tilePos[1],
      );

      const animatedTileElement = document.createElement("canvas");
      animatedTileElement.width = size;
      animatedTileElement.height = size;
      animatedTileElement.style.position = "absolute";
      animatedTileElement.style.transform = tileElement.style.transform;
      const context = animatedTileElement.getContext("2d");
      context.drawImage(tileElement, 0, 0);
      tileElement.parentElement.appendChild(animatedTileElement);

      const newPosition = `translate(${holeY * (size + margin)}px, ${holeX * (size + margin)
        }px)`;
      let keyframes = [];
      keyframes.push({
        transform: newPosition,
      });

      console.log(keyframes);
      const animation = animatedTileElement.animate(keyframes, {
        duration: 200,
        iterations: 1,
        easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
        fill: "forwards",
      });

      const animationFinished = () => {
        const newPos = JSON.parse(JSON.stringify(pos));
        newPos[holeX][holeY] = tilePos;
        newPos[targetX][targetY] = null;
        setPos(newPos);
        animation.removeEventListener("finish", animationFinished);

        requestAnimationFrame(() => {
          setHideTile(null);
          requestAnimationFrame(() => {
            tileElement.parentElement.removeChild(animatedTileElement);
          });
        });
      };

      animation.addEventListener("finish", animationFinished);
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  });

  return (
    <>
      <div
        style={{
          transform: "translate(-50%, 0)",
          height: "350px",
        }}
      >
        {tiles}
      </div>
      {allCorrect && (
        <div>
          <div class="win">GOOD JOB!</div>
          <button
            class="again"
            onClick={() => {
              window.location.reload();
            }}
          >
            PLAY AGAIN!
          </button>
        </div>
      )}
    </>
  );
}

export default function App({ n = 3, size = 150 }) {
  const [foo, setFoo] = useState(1);

  return (
    <div className="App">
      <Board n={n} size={size} />
    </div>
  );
}
