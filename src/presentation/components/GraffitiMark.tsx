import React from "react";
import { assetUrl } from "../assets";

export default function GraffitiMark() {
  return (
    <div className="story-illustration graffiti-mark">
      <span className="story-orbit" aria-hidden="true" />
      <img
        className="graffiti-artwork"
        src={assetUrl("/media/step-graffiti.png")}
        alt="Без рамок"
        width="1024"
        height="1024"
        loading="lazy"
        draggable={false}
      />
      <span className="story-spark spark-one" aria-hidden="true">
        ✦
      </span>
      <span className="story-spark spark-two" aria-hidden="true">
        ✳
      </span>
    </div>
  );
}
