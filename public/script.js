// Setting up the event listener
document.addEventListener("DOMContentLoaded", function () {
    // For each element inside container
    document.querySelectorAll(".question-container").forEach(container => {
        const questionID = container.querySelector("h2").getAttribute("data-questionid"); // Fetching the questionID

        // Add event listener for all 4 answer buttons
        container.querySelectorAll(".answer-button").forEach(button => {
            button.addEventListener("click", async () => { // When a button is clicked

                const answer = button.textContent.trim(); // Fetched the answer from the button

                const response = await fetch("/answer", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json" // Sending data as JSON
                    },
                    body: JSON.stringify({ answer, questionID })
                });

                const data = await response.json(); // Parse response as JSON


                handleResponse(button, data.isCorrect);

                // Disableanswer buttons
                container.querySelectorAll('.answer-button').forEach(btn => {
                    btn.disabled = true;
                    btn.classList.add('disabled-button');
                });

                // Disable the "not-sure" button
                container.querySelector('.not-sure-button').disabled = true;
                container.querySelector('.not-sure-button').classList.add('disabled-button');

                // Display the 'next' button
                container.querySelector('.next-button').style.display = 'inline';
            });
        });

        // Add eventer listener for not sure button
        container.querySelector('.not-sure-button').addEventListener('click', async () => {
            const answer = "I don't know";
            const questionID = container.querySelector("h2").getAttribute("data-questionid"); // Fetching the questionID

            const response = await fetch('/answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answer, questionID })
            });

            const data = await response.json();
            handleResponse(container.querySelector('.not-sure-button'), data.isCorrect);

            container.querySelectorAll('.answer-button').forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled-button');
            });

            container.querySelector('.not-sure-button').disabled = true;
            container.querySelector('.not-sure-button').classList.add('disabled-button');

            container.querySelector('.next-button').style.display = 'inline';
        })

        container.querySelector('.next-button').addEventListener('click', () => {
            location.reload(); // Refresh the page
        })
    })
})

function handleResponse(button, isCorrect) {
    if (isCorrect) {
        button.style.backgroundColor = '#4caf50';
        button.style.borderColor = '#4caf50';
        button.style.color = "white"
    } else {
        button.style.backgroundColor = 'red';
        button.style.borderColor = 'red';
        button.style.color = "white";
    }
}

