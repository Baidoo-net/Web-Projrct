function getNumber(number) {
    let display = document.getElementById('display');
    const displayValue = display.innerText;
    const lastChar = displayValue.slice(-1);
    
    if (displayValue === '0') {
        display.innerText = number;
    } 
    // If the last character was a closing parenthesis, we need to insert a multiplication operator first.
    else if (lastChar === ')') {
        display.innerText += '*' + number;
    }
    else {
        display.innerText += number;
    }
}


function cleardisplay()
{
    display.innerText = '0'
}

function addOperand(operand)
{ if (display.innerText == 0)
{
     return;
}
    display.innerText = display.innerText + operand;
    
}
// Existing functions (getNumber, cleardisplay, addOperand) go here...
function calculate() {
    let display = document.getElementById('display');
    let expression = display.innerText;
    
    if (expression === '0' || expression === '') {
        return;
    }

    try {
       
        while (openParenthesesCount > 0) {
            expression += ')';
            openParenthesesCount--;
        }
        // --- End Parenthesis Logic ---

        expression = expression.replace(/÷/g, '/');
        let result = eval(expression);

        if (!isFinite(result)) {
            display.innerText = 'Error';
            return;
        }

        display.innerText = result;

    } catch (e) {
        display.innerText = 'Error';
        openParenthesesCount = 0; // Reset count on error
    }
}

let openParenthesesCount = 0; 
function addParenthesis() {
    let display = document.getElementById('display');
    const displayValue = display.innerText;
    const lastChar = displayValue.slice(-1);
    const operators = ['+', '-', '*', '/'];
   
    if (displayValue === '0' || displayValue === '' || operators.includes(lastChar) || lastChar === '(') {
        
        if (displayValue === '0' || displayValue === '') {
            display.innerText = '('; // Start a new expression with '('
        } else {
            display.innerText += '('; // Append '(' to an existing expression
        }
        openParenthesesCount++;
        return;
    }

    
    if (openParenthesesCount > 0 && !isNaN(parseFloat(lastChar))) {
        display.innerText += ')';
        openParenthesesCount--;
        return;
    }
}

