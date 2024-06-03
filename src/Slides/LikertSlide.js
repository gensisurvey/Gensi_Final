import React from "react";
import "./LikertSlide.css"; // Import CSS file for styling
import LikertScale from "./LikertScale.js";

const LikertScaleSlide = ({
  scalePrompt,
  questions,
  left,
  right,
  possibleAnswers,
  id,
  updateCurrentSelection,
}) => {

  return (
    <div>
      <h1 className="likert-scale-prompt">{scalePrompt}</h1>
      <hr style={{ marginBottom: 20 }} />


      {questions.map((question, index) => (
        <>
          <LikertScale
            question={question}
            possibleAnswers={possibleAnswers}
            left={left}
            right={right}
            id={id + "_" + index.toString()}
            key={(index + 45921) * 973223}
            index={(index + 459) * 97}
            updateCurrentSelection={updateCurrentSelection}
          />
        </>
      ))}
      <hr style={{ marginTop: 20 }} />
    </div>
  );
};

export default LikertScaleSlide;
