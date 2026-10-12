import React from "react";

/** Decorative brand sticker, kept out of the product's reading order. */
export default function IndieNote() {
  return (
    <div className="indie-note" aria-hidden="true" data-ambient>
      <svg className="note-sticker" viewBox="0 0 120 120" fill="none">
        <path d="m60 4 12 13 17-5 5 18 18 5-5 18 10 13-15 11 1 19-19 1-10 15-15-10-17 5-6-17-18-6 6-17L4 57l14-12-1-18 18-1 10-16Z" />
        <text x="60" y="54" textAnchor="middle">
          свой
        </text>
        <text x="60" y="78" textAnchor="middle">
          ритм.
        </text>
      </svg>
      <span>без лишних правил</span>
      <svg className="note-arrow" viewBox="0 0 100 60" fill="none">
        <path d="M86 5C84 34 61 25 37 27S11 38 14 51m0 0 14-8M14 51l-7-14" />
      </svg>
    </div>
  );
}
