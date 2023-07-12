let correct = ["block", "century_eater", "3"];
let response = ["you better study", "keep it up", "not bad", "cool"]

function on_sumbit()
{
    let answers = [];
    answers[0] = document.querySelector('input[name="q1"]:checked').value;
    answers[1] = document.querySelector('input[name="q2"]:checked').value;
    answers[2] = document.querySelector('input[name="q3"]').value;

    let correct_count = 0;
    for (let i = 0; i < 3; ++i)
    {
        alert(`Question ${i + 1}: correct was ${correct[i]}, you chose ${answers[i]}`);
        correct_count += correct[i] == answers[i];
    }

    alert(`You got ${correct_count}/3, ${response[correct_count]}`);
}