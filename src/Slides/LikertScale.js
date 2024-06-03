import React, { useState, useEffect, useContext } from "react";
import { SelectionData } from "../SelectionData.js";

import "./LikertSlide.css"; // Import CSS file for styling

const LikertScale = ({
  question,
  possibleAnswers,
  left,
  right,
  updateCurrentSelection,
  id,
}) => {
  const [selectedOption, setSelectedOption] = useState([]);
  const { selectionData, setSelectionData } = useContext(SelectionData);

  useEffect(() => {
    if (
      selectionData &&
      typeof selectionData === "object" &&
      selectionData.hasOwnProperty(id)
    ) {
      // selectionData is defined, is an object, and has the specified key 'id'
      setSelectedOption(selectionData[id]);
    } else {
      updateCurrentSelection({
        key: id,
        data: null,
        override: false,
        nextBlocked: true,
      });
    } // Check if this line is correct
  }, []);

  const handleOptionSelect = (option) => {
    updateCurrentSelection({
      key: id,
      data: option,
      override: false,
      nextBlocked: true,
    }); // Check if this line is correct
    setSelectedOption(option);
  };

  return (
    <div
      key={id + 17}
      className={`likert-scale-slide ${id + 17 === 0 ? "first-likert" : ""}`}
    >
      <div className="likert-scale-question">{question}</div>
      {left !== right && <div className="likert-left-right-container">
        <p className="likert-left">{left}</p>
        <p className="likert-right">{right}</p>
      </div>}

      <div className="likert-scale-options">
        {possibleAnswers.map((answer, i) => (
          <div
            className={`likert-option${
              selectedOption === answer ? " selected" : ""
            }`}
            onClick={() => handleOptionSelect(answer)}
            key={i * 6931214}
            id={i * 6931214}
          >
            {answer}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LikertScale;
