import React, { useState, useEffect, useContext } from "react";
import { SelectionData } from "../SelectionData.js";

import "./OpenInput.css";

const MultipleChoiceSlide = ({ question, updateCurrentSelection, id, numeric }) => {
  const [inputValue, setInputValue] = useState("");
  const { selectionData, setSelectionData } = useContext(SelectionData);
  const val = event.target.value; 

  useEffect(() => {
    if (
      selectionData &&
      typeof selectionData === "object" &&
      selectionData.hasOwnProperty(id)
    ) {
      // selectionData is defined, is an object, and has the specified key 'id'
      setInputValue(selectionData[id]);
    } else {
      updateCurrentSelection({
        key: id,
        data: null,
        override: false,
        nextBlocked: val === "" || val === null,
      });
    } // Check if this line is correct
  }, []);

  const handleInput = (event) => {
  const val = event.target.value;

  // If numeric, only allow digits
  if (numeric && !/^\d*$/.test(val)) {
    return;
  }

  setInputValue(val);

  updateCurrentSelection({
    key: id,
    data: val,
    override: false,
    nextBlocked: val === "" || val === null,
  });
};

  return (
    <div className="option-input-container">
      <h2 className="option-input-question">{question}</h2>
    <input
  className="option-input-input"
  type={numeric ? "number" : "text"}
  value={inputValue}
  onChange={handleInput}
/>
    </div>
  );
};

export default MultipleChoiceSlide;
