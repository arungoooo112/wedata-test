//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState() || { test: [] };

    /** @type {Array<{ value: string }>} */
    let test = oldState.test;

    updateColorList(test);

    document.querySelector('.add-color').addEventListener('click', () => {
        addTest();
        vscode.postMessage({ type: 'testelected', value: "adsfa" });
    });
    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'addTest':
                {
                    addTest();
                    break;
                }
            case 'cleartest':
                {
                    test = [];
                    updateColorList(test);
                    break;
                }

        }
    });

    /**
     * @param {Array<{ value: string }>} test
     */
    function updateColorList(test) {
        const ul = document.querySelector('.color-list');
        ul.textContent = '';
        for (const color of test) {
            const li = document.createElement('li');
            li.className = 'color-entry';

            const colorPreview = document.createElement('div');
            colorPreview.className = 'color-preview';
            colorPreview.textContent = '01';
            colorPreview.style.backgroundColor = `#${color.value}`;
            
            colorPreview.addEventListener('click', () => {
                onColorClicked(color.value);
            });
            li.appendChild(colorPreview);

            const input = document.createElement('input');
            input.className = 'color-input';
            input.type = 'text';
            input.value = color.value;
            input.addEventListener('change', (e) => {
                const value = e.target.value;
                if (!value) {
                    // Treat empty value as delete
                    test.splice(test.indexOf(color), 1);
                } else {
                    color.value = value;
                }
                updateColorList(test);
            });
            li.appendChild(input);

            ul.appendChild(li);
        }

        // Update the saved state
        vscode.setState({ test: test });
    }

    /** 
     * @param {string} color 
     */
    function onColorClicked(color) {
        vscode.postMessage({ type: 'testelected', value: color });
    }

    /**
     * @returns string
     */
    function getNewwedataColor() {
        const test = ['020202', 'f1eeee', 'a85b20', 'daab70', 'efcb99'];
        return test[Math.floor(Math.random() * test.length)];
    }

    function addTest() {
        test.push({ value: getNewwedataColor() });
        updateColorList(test);
    }
}());


