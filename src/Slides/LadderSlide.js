import React, { useEffect, useState, useContext } from "react";
import { SelectionData } from "../SelectionData.js";

import "./LadderSlide.css";

const LadderSlide = ({
  promptText,
  promptText2,
  ladderPrompt,
  ladderImg,
  person_of_interest,
  updateCurrentSelection,
  individual,
  id,
}) => {
  const [ladderRung, setLadderRung] = useState("");
  const [flash, setFlash] = useState(false); // State to toggle flashing effect
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { selectionData, setSelectionData } = useContext(SelectionData);


  useEffect(() => {
    if (selectionData && typeof selectionData === 'object' && selectionData.hasOwnProperty(id) && selectionData[id] !== 0) {
      // selectionData is defined, is an object, and has the specified key 'id'
      setLadderRung(selectionData[id])
    } else if (
    (selectionData.all_people[person_of_interest] === -1 || selectionData.all_people.length <= person_of_interest && person_of_interest !== selectionData.max_nom)) {
      updateCurrentSelection({
        key: id,
        data: 0,
        override: true,
        nextBlocked: false,
      });
    } else {
      updateCurrentSelection({
        key: id,
        data: 0,
        override: false,
        nextBlocked: true,
      });
    }
  }, []);

  const handleChange = (e) => {
    let input = e.target.value.trim();

    if (input === "10") {
      input = "10";
    } else if (input.length === 2) {
      input = input.slice(1); // Remove the first character
    } else if (input.length >= 3) {
      input = input.slice(1); // Remove the first character
      input = input.slice(1); // Remove the first character
    }

    const isValidInput = /^(10|[1-9])$/.test(input); // Updated regex

    if (isValidInput) {
      setLadderRung(input);
      setFlash(false); // Reset flash when input is valid
      updateCurrentSelection({
        key: id,
        data: input,
        override: false,
        nextBlocked: false,
      });
    } else {
      setFlash(true); // Activate flashing effect when input is invalid
      setTimeout(() => setFlash(false), 1000); // Turn off flashing after 0.5s
    }
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();

  //   if (ladderRung === "") {
  //     setFlash(true); // Activate flashing effect when input is empty
  //     setTimeout(() => setFlash(false), 1000); // Turn off flashing after 0.5s
  //   } else {
  //     setIsSubmitted(true)
  //     updateCurrentSelection({
  //       key: id,
  //       data: ladderRung,
  //       override: false,
  //       nextBlocked: false,
  //     });
  //   }
  // };

  return (
    <>
      <div
        className={
          individual ? "ladder-text-wrapper-individual" : "ladder-text-wrapper"
        }
      >
        <h1 className={individual ? "ladder-h1-individual" : "ladder-h1"}>
          {promptText}
        </h1>
        <h2 className="ladder-h2">{promptText2}</h2>
      </div>
      {!isSubmitted ? (
        <div key="outer" className="mini-ladder-wrapper">
          <div className="ladder-mini-box">
            {ladderPrompt}
            <div className="ladder-img-container">
              {ladderImg && (
                <img src={ladderImg} alt="Logo" className="ladder-img" />
              )}
            </div>
            {/* <form > */}
            <input
              className={flash ? "add-flash ladder-input" : "ladder-input"}
              type="text"
              value={ladderRung}
              onChange={handleChange}
              placeholder="1-10"
            />
              {/* <button className="ladder-button" type="submit">
                Add
              </button> */}
            {/* </form> */}
          </div>
        </div>
      ) : individual ? (
        <div>Thank you</div>
      ) : (
        <div>Thank you, click next slide please</div>
      )}
    </>
  );
};

export default LadderSlide;
