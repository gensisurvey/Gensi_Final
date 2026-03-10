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

const shuffleArray = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
};

const App = () => {
  const { selectionData, setSelectionData } = useContext(SelectionData);
  const [slideIndex, setSlideIndex] = useState(-1);
  const [nextSlideToBackTo, setNextSlideToBackTo] = useState([]);
const [scaleOrder] = useState(() =>
  shuffleArray(["UCLA", "MHC", "attachment"])
);
const [demoOrder] = useState(() =>
  shuffleArray([
    "Ethnicity",
    "Gender",
	  "famIncome",
	  "parentNumber",
	  "genFriends",
	  "instaFollowers",
	  "ladderCU"  ])
);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [nextBlocked, setNextBlocked] = useState(false);
  const [submittedToFirebase, setSubmittedToFirebase] = useState(false);

  const TOTAL_SLIDES = 25; // added 1 for demographics,
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
    question={
		<span>
        <p><strong>Welcome to our study!</strong></p>

        <p>
          You are invited to take part in a research study examining social ties in group and team settings.
          Please read this form carefully before agreeing to take part in the study.
        </p>

        <p>
          This study is being led by Alaa Itani, Wicia Fang, and Dr. Vivian Zayas in the
          Department of Psychology at Cornell University.
        </p>

        <p>
          What the study is about
        </p>
        <p>
          The purpose of this study is to explore how people think and feel about their social
          ties in social groups and team settings.
        </p>

        <p>
          What we will ask you to do
        </p>
        <p>
          If you agree to be in this study, you will be asked to complete several short surveys
          about yourself and how you feel and think about the people in your group/team.
          The study will take approximately 5 minutes to complete. You are free not to answer
          any questions you do not wish to answer, and to discontinue participation at any point.
        </p>

        <p>
          Risks and discomforts
        </p>
        <p>
          We do not anticipate any risks from participating in this research.
          You are free not to answer any questions you do not wish to answer.
        </p>

        <p>
          Benefits
        </p>
        <p>
          Participating in this study provides no direct benefits to you.
          However, we hope with your participation to broaden our understanding of how
          people perceive and navigate social relationships and team dynamics.
        </p>

        <p>
          Incentives for participation
        </p>
        <p>
          You will receive a $10 gift card for participating in the study.
        </p>

        <p>
          As an additional group appreciation gesture, if at least 95% of eligible team
          members choose to complete the survey, the research team will provide pizza
          for the team. This group incentive is not part of your individual compensation.
          Your decision to participate or not participate is entirely voluntary.
          Choosing not to participate will involve no penalty or loss of benefits to
          which you are otherwise entitled. Individual participation decisions will not
          be shared with coaches, teammates, or anyone outside the research team.
        </p>

        <p>
          Privacy/Confidentiality/Data Security
        </p>
        <p>
          Data from the questionnaires will be stored using numerical ID codes without
          any identifying information. All data will be stored on a password protected,
          encrypted computer/server. Your identity will not be revealed in publications
          or any other outlet. Data from this project may be made available to other
          researchers in the future; should this occur, the data will contain no
          identifying information that could associate your name with participation
          in this project.
        </p>

        <p>
          Please note that the survey is being conducted with the help of Github and
          Netlify. We anticipate that your participation in this survey presents no
          greater risk than everyday use of the Internet. We cannot guarantee against
          interception of data sent via the internet by third parties.
        </p>

        <p>
          Sharing De-identified Data Collected in this Research
        </p>
        <p>
          De-identified data from this study may be shared with the research community
          at large to advance science and health. We will remove or code any personal
          information that could identify you before files are shared with other
          researchers. Despite these measures, we cannot guarantee anonymity of your
          personal data.
        </p>

        <p>
          Taking part is voluntary
        </p>
        <p>
          You are free to stop participating at any time. Whether or not you consent
          to participate will not affect your current or future relationship with
          Cornell University.
        </p>

        <p>
          If you have questions
        </p>
        <p>
          If you have questions, you may contact Alaa Itani at ai293@cornell.edu.
          If you have any questions or concerns regarding your rights as a subject
          in this study, you may contact the Institutional Review Board (IRB) for
          Human Participants at 607-255-6182.
        </p>

        <p>
          Statement of Consent
        </p>
        <p>
          I have read the above information and have received answers to any questions I asked.
        </p>

        <p><strong>Do you consent to participating in this study?</strong></p>

      </span>
    }
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
                promptText="Some of the people on this team may be a safe person for you to turn to, during challenging, threatening, or uncertain times."
                promptText2="Think about any individuals in your team who are a safe person for you to turn to when you are having a bad day or had a negative experience. Please nominate each person who comes to mind. Type in the first name of each person."
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
                    Which of these individuals do <b style={{ fontWeight: 600, fontSize: "1.05em" }}>you</b> turn to as a
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
                  <span>
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
                  </p>
                  <p>
                    Which of these individuals do you think{" "}
                    <b style={{ fontWeight: 600, fontSize: "1.05em" }}>{selectionData.all_people[0]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                      </p>
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
                  <span>
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
                  </p>
                  <p>
                    Which of these individuals do you think{" "}
                    <b style={{ fontWeight: 600, fontSize: "1.05em" }}>{selectionData.all_people[1]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                      </p>
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
                  <span>
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
                  </p>
                  <p>
                    Which of these individuals do you think{" "}
                    <b style={{ fontWeight: 600, fontSize: "1.05em" }}>{selectionData.all_people[2]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                      </p>
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
                  <span>
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
                  </p>
                  <p>
                    Which of these individuals do you think{" "}
                    <b style={{ fontWeight: 600, fontSize: "1.05em" }}>{selectionData.all_people[3]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                      </p>
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
                  <span>
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
                  </p>
                  <p>
                    Which of these individuals do you think{" "}
                    <b style={{ fontWeight: 600, fontSize: "1.05em" }}>{selectionData.all_people[4]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                      </p>
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
                  <span>
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
                  </p>
                  <p>
                    Which of these individuals do you think{" "}
                    <b style={{ fontWeight: 600, fontSize: "1.05em" }}>{selectionData.all_people[5]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                      </p>
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
                  <span>
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
                  </p>
                  <p>
                    Which of these individuals do you think{" "}
                    <b style={{ fontWeight: 600, fontSize: "1.05em" }}>{selectionData.all_people[6]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                      </p>
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
                  <span>
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
                  </p>
                  <p>
                    Which of these individuals do you think{" "}
                    <b style={{ fontWeight: 600, fontSize: "1.05em" }}>{selectionData.all_people[7]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                      </p>
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
                 <span>
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
                  </p>
                  <p>
                    Which of these individuals do you think{" "}
                    <b style={{ fontWeight: 600, fontSize: "1.05em" }}>{selectionData.all_people[8]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                      </p>
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
                  <span>
                  <p>
                  These are the individual(s) you nominated as a safe person for you to turn to when you are having a bad day or had a negative experience.
                  </p>
                  <p>
                    Which of these individuals do you think{" "}
                    <b style={{ fontWeight: 600, fontSize: "1.05em" }}>{selectionData.all_people[9]}</b> turns to as a safe
                    person when they are having a bad day or had a negative
                    experience?
                      </p>
                  </span>
                }
                num_to_exclude={9}
                updateCurrentSelection={updateCurrentSelection}
                key={"all_people_turn_to_9"}
                id={"all_people_turn_to_9"}
              />
            )}

            {/* =====================================================
          
          Ladder slides - team
          
          =====================================================*/}
            {slideIndex >= 12 &&
              slideIndex <= 12 + selectionData.max_nom &&
              selectionData["clockwise_name_order"].map(
                (value, index) =>
                  slideIndex === index + 12 && (
                    <LadderSlide
                      promptText="Think of this ladder as representing your team."
                     promptText2={
                       <div>
                       <p>
      At the top of the ladder are the people who are the best in the team.
      At the bottom are the people who are the worst in the team.
    </p>
    <p>
      Where do you think{" "}
      <b style={{ fontWeight: 600, fontSize: "1.05em" }}>
        {value === selectionData.max_nom
          ? "you"
          : selectionData.all_people[value]}
      </b>{" "}
      {value === selectionData.max_nom ? "stand" : "stands"} on the ladder?
    </p>
  </div>
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
          
          Ladder slides - US
          
          =====================================================*/}
            {slideIndex >= 23 &&
              slideIndex <= 23 + selectionData.max_nom &&
              selectionData["clockwise_name_order"].map(
                (value, index) =>
                  slideIndex === index + 23 && (
                    <LadderSlide
                      promptText="Think of this ladder as representing the United States."
                     promptText2={
                       <div>
                       <p>
      At the top of the ladder are the people who are the best off in the United States.
      At the bottom are the people who are the worst off in the United States.
    </p>
    <p>
      Where do you think{" "}
      <b style={{ fontWeight: 600, fontSize: "1.05em" }}>
        {value === selectionData.max_nom
          ? "you"
          : selectionData.all_people[value]}
      </b>{" "}
      {value === selectionData.max_nom ? "stand" : "stands"} on the ladder?
    </p>
  </div>
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
            {slideIndex === 34 && (
              <div>
               		<>
                     <OpenInput
                      question={
                        "Approximately, how many people on the team do you think would turn to you for support if they needed it?"
                      }
                      updateCurrentSelection={updateCurrentSelection}
                      key={"turnedtoavg"}
                      id={"turnedtoavg"}
                    />
                         <OpenInput
                      question={
                        "Approximately, how many people on the team could you turn to for support if you needed it?"
                      }
                      updateCurrentSelection={updateCurrentSelection}
                      key={"turntoavg"}
                      id={"turntoavg"}
                    />
<div style={{ height: "20px" }} />
                        <LikertScaleSlide
                      scalePrompt={"Please fill out this scale about your team"}
                      questions={[
                        "How important is this team to you?",
                      ]}
                      left={"Not at all"}
                      right={"A great deal"}
                      possibleAnswers={["1", "2", "3", "4", "5", "6", "7"]}
                      updateCurrentSelection={updateCurrentSelection}
                      id={"important"}
                      key={"important"}
                    />

                           <LikertScaleSlide
                      scalePrompt={"Please fill out this scale about your team"}
                      questions={[
                        "How much time do you spend with this team?",
                      ]}
                      left={"None"}
                      right={"A great deal"}
                      possibleAnswers={["1", "2", "3", "4", "5", "6", "7"]}
                      updateCurrentSelection={updateCurrentSelection}
                      id={"timespent"}
                      key={"timepsent"}
                    />
						
                        {scaleOrder.map((item) => {

  if (item === "UCLA") {
    return (
                    <LikertScaleSlide
                      scalePrompt={"Please fill out this scale about yourself"}
                      questions={[
                        "First, how often do you feel that you lack companionship?",
                        "How often do you feel left out?",
                        "How often do you feel isolated from others?",
                      ]}
                      right={"Always"}
                      left={"Never"}
                      possibleAnswers={["1", "2", "3", "4", "5", "6", "7"]}
                      updateCurrentSelection={updateCurrentSelection}
                      id={"UCLAMini"}
                      key={"UCLAMini"}
                    />
						  );
  }
	   if (item === "MHC") {
    return (
                    <LikertScaleSlide
                      scalePrompt={"Please fill out this scale. ​​During the past month, how often did you feel… "}
                      questions={[
                        "Happy",
                        "Interested in life",
                        "Satisfied with life",
                        "That you had something important to contribute to society",
                        "That you belonged to a community (like a social group, or your neighborhood)",
                        "That our society is a good place, or is becoming a better place, for all people",
                        "That people are basically good",
                        "That the way our society works makes sense to you",
                        "That you liked most parts of your personality",
                        "Good at managing the responsibilities of your daily life",
                        "That you had warm and trusting relationships with others",
                        "That you had experiences that challenged you to grow and become a better person",
                        "Confident to think or express your own ideas and opinions",
                        "That your life has a sense of direction and meaning to it"
                      ]}
			 		right={"Every day"}
                      left={"Never"}
                      possibleAnswers={["1", "2", "​3", "4", "5", "6", "7"]}
                      updateCurrentSelection={updateCurrentSelection}
                      id={"MHC"}
                      key={"MHC"}
                    />      
						  );
  }
		   if (item === "attachment") {
    return (
		    <div key="attachment">
                    <MultipleChoiceSlide
                      question={"Please indicate which general relationship style best describes you or is closest to the way you are"}
                      options={[
                        "It is easy for me to become emotionally close to others. I am comfortable depending on them and having them depend on me. I don’t worry about being alone or having others not accept me.",
                        "I am uncomfortable getting close to others. I want emotionally close relationships, but I find it difficult to trust others completely, or to depend on them. I worry that I will be hurt if I allow myself to become too close to others.",
                        "I want to be completely emotionally intimate with others, but I often find that others are reluctant to get as close as I would like. I am uncomfortable being without close relationships, but I sometimes worry that others don’t value me as much as I value them.",
                        "I am comfortable without close emotional relationships. It is very important to me to feel independent and self-sufficient, and I prefer not to depend on others or have others depend on me."
                      ]}
                      add_other_option={false}
                      checkbox={false}
                      updateCurrentSelection={updateCurrentSelection}
                      key={"attachmentcat"}
                      id={"attachmentcat"}
                    />

                    <LikertScaleSlide
                      scalePrompt={"Please rate each of the relationship styles above to indicate how well or poorly each description corresponds to your general relationship style."}
                      questions={[
                        "It is easy for me to become emotionally close to others. I am comfortable depending on them and having them depend on me. I don’t worry about being alone or having others not accept me.",
                        "I am uncomfortable getting close to others. I want emotionally close relationships, but I find it difficult to trust others completely, or to depend on them. I worry that I will be hurt if I allow myself to become too close to others.",
                        "I want to be completely emotionally intimate with others, but I often find that others are reluctant to get as close as I would like. I am uncomfortable being without close relationships, but I sometimes worry that others don’t value me as much as I value them.",
                        "I am comfortable without close emotional relationships. It is very important to me to feel independent and self-sufficient, and I prefer not to depend on others or have others depend on me.",
                      ]}
                      right={"Disagree strongly"}
                      left={"Agree strongly"}
                      possibleAnswers={["1", "2", "3", "4", "5", "6", "7"]}
                      updateCurrentSelection={updateCurrentSelection}
                      id={"attachmentcont"}
                      key={"attachmentcont"}
                   />
                      </div>
          );
        }

        return null;

      })}

    </>

  </div>
)}

			 
					 {slideIndex === 35 && (
              <div>
               {demoOrder.map((item) => {

      if (item === "Ethnicity") {
        return (	  
                    <MultipleChoiceSlide
                      question={"Please indicate your race/ethnicity:"}
                      options={[
                        "White",
                        "Hispanic or Latino",
						  "Middle Eastern or North African",
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
						  );
	  							}

		  if (item === "Gender") {
        return (
                    <MultipleChoiceSlide
                      question={"What is your gender?"}
                      options={["Man", "Woman"]}
                      add_other_option={true}
                      checkbox={false}
                      updateCurrentSelection={updateCurrentSelection}
                      key={"Gender"}
                      id={"Gender"}
                    />
						   );
	  							}

						  if (item === "famIncome") {
        return (
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
						   );
	  							}

						  if (item === "parentNumber") {
        return (
			    <div key="parentNumber">
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
				       </div>
				    );
	  							}

							if (item === "genFriends") {
        return (
    <div key="genFriends">

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
												       </div>
							   );
	  							}
							if (item === "instaFollowers") {
        return (
			  <div key="instaFollowers">
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
						    </div>
			 );
	  							}

						  if (item === "ladderCU") {
        return (
                    <LadderSlide
                      promptText="Think of this ladder as representing where students stand at Cornell University."
                      promptText2="At the top of the ladder are the students who are the best off. At the bottom are the students who are the worst off. The higher up you are on this ladder, the closer you are to the people at the very top; the lower you are, the closer you are to the people at the very bottom."
                      ladderPrompt={"Where do you think you stand on the ladder?"                     
                      }
                      nodeNames={["You"]}
                      updateCurrentSelection={updateCurrentSelection}
                      maxNom={1}
                      individual={true}
                      ladderImg={LadderImg}
                      key={"ladderCU"}
                      id={"ladderCU"}
                    />
                     );
	  							}
				   return null; 
                })}
							  </div>
            )}

            {/* =====================================================
          
          Survey Feedback question
          
          =====================================================*/}
            {slideIndex === 36 && (
              <NodeInputSlide
                promptText="Thank you for completing the study. Please provide us with feedback (if any) in the textbox below."
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
