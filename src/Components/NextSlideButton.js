// NextSlideButton.jsx

import React from 'react';
import './NextSlideButton.css'; // Import CSS file for styling

const NextSlideButton = ({ onClick, nextBlocked, nextBlockOverride }) => {

  const handleOverrideYes = () => {
    nextBlockOverride(true)
  }

  const handleOverrideNo = () => {
    nextBlockOverride(false)
  }

  return (
    <div className="next-slide-button-container">
      {/* <p className="error-message">{nextBlocked && 'Do not submit nothing!'}</p> */}
      {nextBlocked && 
      <div className='box-wrapper'>
        <p className='text-override'>Are you sure you want to proceed?</p>
        <button onClick={handleOverrideYes} className='override-button-y'>Yes</button>
        <button onClick={handleOverrideNo} className='override-button-n'>No</button>

      </div>

      }
      <button onClick={onClick} className={nextBlocked ? 'flash next-slide-button' : 'next-slide-button'}>
        Next Slide
      </button>
    </div>
  );
};

export default NextSlideButton;
