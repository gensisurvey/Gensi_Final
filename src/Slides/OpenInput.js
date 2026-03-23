import React, { useState, useEffect, useContext } from "react";
import { SelectionData } from "../SelectionData.js";

import "./OpenInput.css";

const MultipleChoiceSlide = ({ question, updateCurrentSelection, id, numeric }) => {
  const [inputValue, setInputValue] = useState("");
  const { selectionData, setSelectionData } = useContext(SelectionData);

  useEffect(() => {
  if (
    selectionData &&
    typeof selectionData === "object" &&
    selectionData.hasOwnProperty(id)
  ) {
    const existingVal = selectionData[id];
    setInputValue(existingVal);

    updateCurrentSelection({
      key: id,
      data: existingVal,
      override: false,
      nextBlocked: existingVal === "" || existingVal === null,
    });
  } else {
    updateCurrentSelection({
      key: id,
      data: null,
      override: false,
      nextBlocked: true,
    });
  }
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
