import React, { useState, useEffect, useContext } from "react";

import MultipleChoiceSlide from "./Slides/MultipleChoiceSlide.js";
import LikertScaleSlide from "./Slides/LikertSlide.js";
import OpenInput from "./Slides/OpenInput.js";
import NodeInputSlide from "./Slides/NodeInputSlide.js";
import NodeConnect1Slide from "./Slides/NodeConnect1Slide.js";
import LadderSlide from "./Slides/LadderSlide.js";

import NextSlideButton from "./Components/NextSlideButton.js";
import PreviousSlideButton from "./Components/PreviousSlideButton.js";
import Banner from "./Components/Banner.js";
import TheSlide from "./Components/TheSlide.js";

import LadderImg from "./Images/ladder.jpg";
import BannerImg from "./Images/cornell_seal_simple_web_black.svg";
import { generateColors, generateRandomID } from "./config/Helper.js";

import { setDoc, doc } from "firebase/firestore";
import { db } from "./config/firestore.js";

import { SelectionData } from "./SelectionData.js";
import "./App.css";

const App = () => {
  const { selectionData, setSelectionData } = useContext(SelectionData);
  const [slideIndex, setSlideIndex] = useState(-1);
  const [nextSlideToBackTo, setNextSlideToBackTo] = useState([]);

  const [currentSelection, setCurrentSelection] = useState(null);
  const [nextBlocked, setNextBlocked] = useState(false);
  const [submittedToFirebase, setSubmittedToFirebase] = useState(false);

  const TOTAL_SLIDES = 24; // added 1 for demographics,
  const TESTING_MODE = false;
  const MAX_NOM = 10;
  const FIREBASE_DB_NAME = "Testing";

  // Runs on website launch

  // Load data from local storage on component mount
  useEffect(() => {
    if (TESTING_MODE) {
      localStorage.clear();
    }

    const storedData = localStorage.getItem("selectionData");
    const selection = storedData ? JSON.parse(storedData) : {}
    setSelectionData(selection);
    
    const storedSlideIndex = localStorage.getItem("slideIndex");
    const slide = storedSlideIndex ? parseInt(storedSlideIndex, 10) : -1
    setSlideIndex(slide);
    
    const prevSlides = localStorage.getItem("nextSlideToBackTo");
    setNextSlideToBackTo(prevSlides ? JSON.parse(prevSlides) : []);

    if (selection !== null || selection !== undefined) {
      if (selection.hasOwnProperty('consent')){
        if (selection['consent'] === 'no' || slide > TOTAL_SLIDES) {
          localStorage.clear();
          setSlideIndex(-1);
          setNextSlideToBackTo([]);
          setCurrentSelection(null);
          setNextBlocked(false);
          setSubmittedToFirebase(false);
          setSelectionData({})
        }
      }
    }
  
    if (localStorage.getItem("MOUNTED") === null) {
      localStorage.setItem("MOUNTED", true);

      const values = Array.from({ length: MAX_NOM + 1 }, (_, index) => index);
      const circleOrderClockwise = values.sort(() => Math.random() - 0.5);

      const next_data_add = { ...selectionData };

      next_data_add["clockwise_name_order"] = circleOrderClockwise;
      next_data_add["max_nom"] = MAX_NOM;
      next_data_add["colors"] = generateColors(MAX_NOM + 1);
      next_data_add["PID"] = generateRandomID()

      setSelectionData(next_data_add);
      first_mount_firebase(next_data_add["PID"]);
    }
    
  }, []);

  // Store slideIndex in local storage on state change
  useEffect(() => {
    localStorage.setItem("slideIndex", slideIndex.toString());
  }, [slideIndex]);

  // Store slideIndex in local storage on state change
  useEffect(() => {
    localStorage.setItem(
      "nextSlideToBackTo",
      JSON.stringify(nextSlideToBackTo)
    );
  }, [nextSlideToBackTo]);

  // on first mount, creates the PID in firebase for future storagr
  const first_mount_firebase = async (date) => {
    try {
      await setDoc(doc(db, FIREBASE_DB_NAME, date.toString()), selectionData);

      console.log("Document written with ID: ", date.toString());
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // updates current PID with new information whenever called
  const add_to_firebase = async (e) => {
    try {
      await setDoc(
        doc(db, FIREBASE_DB_NAME, selectionData["PID"].toString()),
        selectionData
      );

      if (TESTING_MODE) {
        console.log(selectionData);
      }
      console.log("Document written to with ID: ", selectionData["PID"]);

      // sets submitted final when the final slide is reached
      if (slideIndex > TOTAL_SLIDES) {
        setSubmittedToFirebase(true);
        const next_data_add = { ...selectionData };
        next_data_add["submitted"] = true;
        setSelectionData(next_data_add);
      }
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // Takes in whatever data, initial or user updated, and placed it inside the output
  const updateCurrentSelection = (option) => {
    const next_data_add = { ...selectionData };
    let current_slide_index = slideIndex;

    next_data_add[option.key] = option.data;

    if (TESTING_MODE) {
      console.log(option);
      console.log(next_data_add);
      console.log(current_slide_index);
    }
    if (option.override) {
      setSlideIndex(slideIndex + 1);
    }

    setCurrentSelection(option);
    setSelectionData(next_data_add);
  };

  // logic for transitioning to the next slide
  const handleNextSlide = () => {
    if (TESTING_MODE) {
      console.log(currentSelection);
    }

    // if there is no input, go to last slide
    if (slideIndex === -1 && currentSelection.data === null) {
      setSlideIndex(TOTAL_SLIDES);
      setSubmittedToFirebase(true);
      // if user does not consent, go to last slide
    } else if (slideIndex === -1 && currentSelection.data === "no") {
      setSlideIndex(TOTAL_SLIDES);
      setSubmittedToFirebase(true);
      // if the state of current slide is to not allow user to move forward, bring up override screen
    } else if (currentSelection.nextBlocked) {
      setNextBlocked(true);
      // the user can move forward, state needs to be updated, next blocked needs to be removed
    } else {
      setNextBlocked(false);

      // setting next slide to back to order for previous slide
      if (slideIndex >= 0) {
        const nextPrevious = [...nextSlideToBackTo];
        nextPrevious.push(slideIndex);
        setNextSlideToBackTo(nextPrevious);
      }
      setSlideIndex(slideIndex + 1);

      add_to_firebase();
    }
  };

  // overrides next blocked, used if yes is clicked on override screen
  const nextBlockOverride = (tf) => {
    setNextBlocked(false);
    if (tf) {
      const nextPrevious = [...nextSlideToBackTo];
      nextPrevious.push(slideIndex);

      setNextSlideToBackTo(nextPrevious);
      setSlideIndex(slideIndex + 1);
    }
  };

  // logic for going to previous slide
  const goBackSlide = () => {
    if (slideIndex > 0) {
      const nextPrevious = [...nextSlideToBackTo];
      const previous = nextPrevious.pop(slideIndex);

      setSlideIndex(previous);
      setNextSlideToBackTo(nextPrevious);
    }
  };

  return (
    <div className="app-box">
      <Banner logo={BannerImg} text={"Cornell University"} />
      <TheSlide>
        {slideIndex <= TOTAL_SLIDES ? (
          <>
            {/* =====================================================
          
          Consent
          
          =====================================================*/}
            {slideIndex === -1 && (
              <MultipleChoiceSlide
                question={"Do you consent to participating in this study?"}
                options={["yes", "no"]}
                updateCurrentSelection={updateCurrentSelection}
                key={"consent"}
                id={"consent"}
              />
            )}

            {/* =====================================================
          
          Slides for inputing names into different categories 
          
          =====================================================*/}
            {slideIndex === 0 && (
              <NodeInputSlide
                promptText="Some of your peers may be a safe person for you to turn to, during challenging, threatening, or uncertain times."
                promptText2="Think about any individuals who are a safe person for you to turn to when you are having a bad day or had a negative experience. Please nominate each person who comes to mind. Type in the first name of each person."
                specialInstructions="NOTE: After typing a name, either press Enter or click Add to include them on your list. When you've added all the names, click Next Slide to continue. Please add initials to duplicate names, the bar will flash if a duplicate is detected."
                inlineText="Write name"
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people"}
                id={"all_people"}
                include_svg={false}
              />
            )}
            {/* =====================================================
          
          Slides for asking which of the nominated will turn to you 
          
          =====================================================*/}
            {slideIndex === 1 && (
              <NodeConnect1Slide
                promptText={
                  <span> 
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
              </p>
                <p>
                    Which of these individuals do <b>you</b> turn to as a
                    safe person when you are having a bad day or had a negative
                    experience?
                      </p>
                  </span>
                }
                num_to_exclude={selectionData.max_nom}
                nodeNames={selectionData.all_people}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_you"}
                id={"all_people_turn_to_you"}
              />
            )}

            {/* =====================================================
          
          Slides asking who your friends turn to
          
          =====================================================*/}

            {slideIndex === 2 && (
              <NodeConnect1Slide
                promptText={
                  "These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience."
                }
                promptText2={
                  <span>
                    Which of these individuals do you think{" "}
                    <b>{selectionData.all_people[0]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                  </span>
                }
                num_to_exclude={0}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_0"}
                id={"all_people_turn_to_0"}
              />
            )}
            {slideIndex === 3 && (
              <NodeConnect1Slide
                promptText={
                  "These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience."
                }
                promptText2={
                  <span>
                    Which of these individuals do you think{" "}
                    <b>{selectionData.all_people[1]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                  </span>
                }
                num_to_exclude={1}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_1"}
                id={"all_people_turn_to_1"}
              />
            )}
            {slideIndex === 4 && (
              <NodeConnect1Slide
                promptText={
                  "These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience."
                }
                promptText2={
                  <span>
                    Which of these individuals do you think{" "}
                    <b>{selectionData.all_people[2]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                  </span>
                }
                num_to_exclude={2}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_2"}
                id={"all_people_turn_to_2"}
              />
            )}
            {slideIndex === 5 && (
              <NodeConnect1Slide
                promptText={
                  "These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience."
                }
                promptText2={
                  <span>
                    Which of these individuals do you think{" "}
                    <b>{selectionData.all_people[3]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                  </span>
                }
                num_to_exclude={3}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_3"}
                id={"all_people_turn_to_3"}
              />
            )}
            {slideIndex === 6 && (
              <NodeConnect1Slide
                promptText={
                  "These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience."
                }
                promptText2={
                  <span>
                    Which of these individuals do you think{" "}
                    <b>{selectionData.all_people[4]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                  </span>
                }
                num_to_exclude={4}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_4"}
                id={"all_people_turn_to_4"}
              />
            )}
            {slideIndex === 7 && (
              <NodeConnect1Slide
                promptText={
                  "These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience."
                }
                promptText2={
                  <span>
                    Which of these individuals do you think{" "}
                    <b>{selectionData.all_people[5]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                  </span>
                }
                num_to_exclude={5}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_5"}
                id={"all_people_turn_to_5"}
              />
            )}
            {slideIndex === 8 && (
              <NodeConnect1Slide
                promptText={
                  "These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience."
                }
                promptText2={
                  <span>
                    Which of these individuals do you think{" "}
                    <b>{selectionData.all_people[6]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                  </span>
                }
                num_to_exclude={6}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_6"}
                id={"all_people_turn_to_6"}
              />
            )}
            {slideIndex === 9 && (
              <NodeConnect1Slide
                promptText={
                  "These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience."
                }
                promptText2={
                  <span>
                    Which of these individuals do you think{" "}
                    <b>{selectionData.all_people[7]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                  </span>
                }
                num_to_exclude={7}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_7"}
                id={"all_people_turn_to_7"}
              />
            )}
            {slideIndex === 10 && (
              <NodeConnect1Slide
                promptText={
                  "These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience."
                }
                promptText2={
                  <span>
                    Which of these individuals do you think{" "}
                    <b>{selectionData.all_people[8]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                  </span>
                }
                num_to_exclude={8}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_8"}
                id={"all_people_turn_to_8"}
              />
            )}
            {slideIndex === 11 && (
              <NodeConnect1Slide
                promptText={
                  "These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience."
                }
                promptText2={
                  <span>
                    Which of these individuals do you think{" "}
                    <b>{selectionData.all_people[9]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                  </span>
                }
                num_to_exclude={9}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_9"}
                id={"all_people_turn_to_9"}
              />
            )}

            {/* =====================================================
          
          Ladder slides 
          
          =====================================================*/}
            {slideIndex >= 12 &&
              slideIndex <= 12 + selectionData.max_nom &&
              selectionData["clockwise_name_order"].map(
                (value, index) =>
                  slideIndex === index + 12 && (
                    <LadderSlide
                      promptText="Think of this ladder as representing the United States."
                      promptText2="At the top of the ladder are the people who are the best off in the United States. At the bottom are the people who are the worst off in the United States."
                      ladderPrompt={
                        <span>
                          Where do you think{" "}
                          <b>
                            {value === selectionData.max_nom
                              ? "you"
                              : selectionData.all_people[value]}
                          </b>{" "}
                          {value === selectionData.max_nom ? "stand" : "stands"}{" "}
                          on the ladder?
                        </span>
                      }
                      ladderImg={LadderImg}
                      person_of_interest={value}
                      updateCurrentSelection={updateCurrentSelection}
                      individual={false}
                      key={
                        "ladder_slide_" +
                        (value === selectionData.max_nom
                          ? "you"
                          : value.toString())
                      }
                      id={
                        "ladder_slide_" +
                        (value === selectionData.max_nom
                          ? "you"
                          : value.toString())
                      }
                    />
                  )
              )}

            {/* =====================================================
          
               Demographics slides

          =====================================================*/}
            {slideIndex === 23 && (
              <div>
                {" "}
                {
                  <>
                    <LikertScaleSlide
                      scalePrompt={"Please fill out this scale"}
                      questions={[
                        "First, how often do you feel that you lack companionship?",
                        "How often do you feel left out?	",
                        "How often do you feel isolated from others?",
                      ]}
                      right={"Always"}
                      left={"Never"}
                      possibleAnswers={["1", "2", "3", "4", "5", "6", "7"]}
                      updateCurrentSelection={updateCurrentSelection}
                      id={"UCLAMini"}
                      key={"UCLAMini"}
                    />
                    <LikertScaleSlide
                      scalePrompt={"Please fill out this scale"}
                      questions={[
                        "First, how often do you feel that you lack companionship: Hardly ever, some of the time, or often?",
                        "How often do you feel left out: Hardly ever, some of the time, or often?	",
                        "How often do you feel isolated from others? (Is it hardly ever, some of the time, or often?)",
                      ]}
                      possibleAnswers={["Hardly Ever", "Sometimes", "Always"]}
                      updateCurrentSelection={updateCurrentSelection}
                      id={"UCLAMiniOther"}
                      key={"UCLAMiniOther"}
                    />

                    <MultipleChoiceSlide
                      question={"Please indicate your race/ethnicity:"}
                      options={[
                        "White",
                        "Hispanic or Latino",
                        "Black or African American",
                        "Native American or American Indian",
                        "Asian/Pacific Islander",
                      ]}
                      add_other_option={true}
                      checkbox={true}
                      updateCurrentSelection={updateCurrentSelection}
                      key={"Ethnicity"}
                      id={"Ethnicity"}
                    />
                    <MultipleChoiceSlide
                      question={"What is your gender?"}
                      options={["Man", "Woman"]}
                      add_other_option={true}
                      checkbox={false}
                      updateCurrentSelection={updateCurrentSelection}
                      key={"Gender"}
                      id={"Gender"}
                    />
                    <MultipleChoiceSlide
                      question={"Approximately, what is your household income?"}
                      options={[
                        "$0 - 20,000",
                        "$20,000 - 40,000",
                        "$40,000 - 60,000",
                        "$60,000 - 80,000",
                        "$80,000 - 100,000",
                        "$100,000 - 120,000",
                        "$120,000 - 140,000",
                        "$140,000 - 160,000",
                        "$160,000 - 180,000",
                        "$180,000 - $200,000",
                      ]}
                      add_other_option={true}
                      checkbox={false}
                      updateCurrentSelection={updateCurrentSelection}
                      key={"famIncome"}
                      id={"famIncome"}
                    />
                    <MultipleChoiceSlide
                      question={
                        "Growing up, how many parent / guardian(s) were in your household?"
                      }
                      options={["1", "2", "Prefer not to say"]}
                      add_other_option={true}
                      checkbox={false}
                      updateCurrentSelection={updateCurrentSelection}
                      key={"parentNumber"}
                      id={"parentNumber"}
                    />
                    {(parseInt(selectionData["parentNumber"], 10) >= 1 ||
                      parseInt(selectionData["parentNumber"], 10) >= 2) && (
                      <MultipleChoiceSlide
                        question={"Parent / Guardian 1: "}
                        options={[
                          "Did not finish high school",
                          "Graduated from high school or equivalent (GED)",
                          "Graduated from a two-year college",
                          "Graduated from a four-year college",
                          "Completed a Master's degree or equivalent",
                          "Completed a Ph.D., M.D., or other advanced professional degree",
                          "Prefer not to say",
                        ]}
                        add_other_option={true}
                        checkbox={false}
                        updateCurrentSelection={updateCurrentSelection}
                        key={"par1Edu"}
                        id={"par1Edu"}
                      />
                    )}
                    {parseInt(selectionData["parentNumber"], 10) >= 2 && (
                      <MultipleChoiceSlide
                        question={"Parent / Guardian 2: "}
                        options={[
                          "Did not finish high school",
                          "Graduated from high school or equivalent (GED)",
                          "Graduated from a two-year college",
                          "Graduated from a four-year college",
                          "Completed a Master's degree or equivalent",
                          "Completed a Ph.D., M.D., or other advanced professional degree",
                          "Prefer not to say",
                        ]}
                        add_other_option={true}
                        checkbox={false}
                        updateCurrentSelection={updateCurrentSelection}
                        key={"par2Edu"}
                        id={"par2Edu"}
                      />
                    )}
                    <OpenInput
                      question={
                        "Approximately, how many friends do you have? (People you socialize with, study with, discuss thoughts and feelings with, share interests with, etc.)"
                      }
                      updateCurrentSelection={updateCurrentSelection}
                      key={"genFriends"}
                      id={"genFriends"}
                    />
                    {selectionData["genFriends"] && (
                      <OpenInput
                        question={`Of your ${selectionData["genFriends"]} friends, how many would you consider a close friend? (Friends you would seek help or support from, share bad news with, discuss difficult emotions with, etc.)`}
                        updateCurrentSelection={updateCurrentSelection}
                        key={"closeFriends"}
                        id={"closeFriends"}
                      />
                    )}
                    <OpenInput
                      question={
                        "Approximately, how many Instagram followers do you have? Enter 'NA' if you do not use this platform."
                      }
                      updateCurrentSelection={updateCurrentSelection}
                      key={"instaFollowers"}
                      id={"instaFollowers"}
                    />
                    <OpenInput
                      question={
                        "Approximately, how many accounts do you follow on Instagram? Enter 'NA' if you do not use this platform."
                      }
                      updateCurrentSelection={updateCurrentSelection}
                      key={"instaFollowing"}
                      id={"instaFollowing"}
                    />
                    <OpenInput
                      question={
                        "Approximately, how many Facebook followers do you have? Enter 'NA' if you do not use this platform."
                      }
                      updateCurrentSelection={updateCurrentSelection}
                      key={"facebookFollowers"}
                      id={"facebookFollowers"}
                    />
                    <OpenInput
                      question={
                        "Approximately, how many accounts do you follow on Facebook? Enter 'NA' if you do not use this platform."
                      }
                      updateCurrentSelection={updateCurrentSelection}
                      key={"facebookFollowing"}
                      id={"facebookFollowing"}
                    />
                    <LadderSlide
                      promptText="Think of this ladder as representing where students stand at Cornell University."
                      promptText2=""
                      ladderPrompt={
                        "At the top of the ladder are the students who are the best off. At the bottom are the students who are the worst off. The higher up you are on this ladder, the closer you are to the people at the very top; the lower you are, the closer you are to the people at the very bottom. "
                      }
                      nodeNames={["You"]}
                      updateCurrentSelection={updateCurrentSelection}
                      maxNom={1}
                      individual={true}
                      ladderImg={LadderImg}
                      key={"ladderCU"}
                      id={"ladderCU"}
                    />
                    <LadderSlide
                      promptText={
                        "Think of this ladder as representing where people stand in the United States."
                      }
                      promptText2=""
                      ladderPrompt={
                        "At the top of the ladder are the people who are the best off. At the bottom are the people who are the worst off. The higher up you are on this ladder, the closer you are to the people at the very top; the lower you are, the closer you are to the people at the very bottom."
                      }
                      nodeNames={["You"]}
                      updateCurrentSelection={updateCurrentSelection}
                      maxNom={1}
                      individual={true}
                      ladderImg={LadderImg}
                      key={"ladderUS"}
                      id={"ladderUS"}
                    />
                  </>
                }
              </div>
            )}

            {/* =====================================================
          
          Survey Feedback question
          
          =====================================================*/}
            {slideIndex === 24 && (
              <NodeInputSlide
                promptText="Thank you for completing the mockup. Please add any kind of feedback."
                inlineText="Write feedback"
                updateCurrentSelection={updateCurrentSelection}
                key={"survey_feedback"}
                id={"survey_feedback"}
                include_svg={false}
              />
            )}
            <NextSlideButton
              nextBlockOverride={nextBlockOverride}
              nextBlocked={nextBlocked}
              onClick={handleNextSlide}
            />
            {slideIndex > 0 && selectionData["consent"] === "yes" && (
              <PreviousSlideButton goBackSlide={goBackSlide} />
            )}
          </>
        ) : (
          <>
            <p style={{ marginLeft: 30 }}>All slides have been completed.</p>
            {submittedToFirebase ||
            selectionData["consent"] !== "yes" ||
            selectionData["submitted"] !== undefined ? (
              <p style={{ marginLeft: 30 }}>
                Thank you, you can close the tab now
              </p>
            ) : (
              <button
                style={{ borderRadius: 5, marginLeft: 30 }}
                onClick={add_to_firebase}
              >
                Click this button to submit
              </button>
            )}
          </>
        )}
      </TheSlide>
    </div>
  );
};

export default App;
