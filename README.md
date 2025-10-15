QVerse – Interactive Quiz App
Objective

QVerse is a web-based interactive quiz application built using HTML, CSS, and JavaScript.
The goal of this project is to create a user-friendly quiz platform that allows participants to answer multiple-choice questions and receive their scores at the end.
It helps in practicing front-end web development concepts such as DOM manipulation, event handling, and dynamic content rendering.

🔗 Live Demo: https://medha312.github.io/QVerse-Your-Quiz-App/

Features

Multiple-choice quiz with a minimum of 5 questions

Real-time answer selection using radio buttons

Automatic score calculation upon submission

Displays total score and performance message

Visually appealing and responsive UI

Option to add a timer and hints (extendable feature)

Project Structure
QVerse-Your-Quiz-App/
│
├── index.html                 # Main HTML structure for quiz layout

├── styles.css                 # CSS for design, fonts, colors, and responsiveness

├── script.js                  # JavaScript logic for quiz questions and scoring

│

├── public/                    # (Optional folder for images/icons)

│

├── Features and workflow.docx  # Documentation file

├── Question bank of quiz app.docx

└── links.docx                 # Supporting reference links



Technologies Used
Technology	Purpose
HTML5	Provides structure and layout for the quiz
CSS3	Adds styling, colors, fonts, and visual feedback
JavaScript (ES6)	Handles interactivity, question logic, and score calculation
How It Works

The HTML defines the quiz layout: title, question container, answer choices, and a submit button.

The JavaScript dynamically loads questions from an internal array and listens for user selections.

On clicking Submit, the selected answers are validated against the correct answers.

The score is then calculated and displayed with a message like:
“You scored 4 out of 5 questions correctly!”

CSS ensures smooth visuals, hover effects, and a clean responsive design.

