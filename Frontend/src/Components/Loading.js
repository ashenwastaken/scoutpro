import React from "react";

export default function Loading({ isLoading }) {
  return (
    <>
      {isLoading && (
        <div className="overlay">
          <span class="loader"></span>
        </div>
      )}
    </>
  );
}
