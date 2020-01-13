/*jslint es6 */
const chrome = require("selenium-webdriver/chrome");
const {Builder, Key, By, until} = require('selenium-webdriver');
/**
 *  Commands webdriver to wait for the page to be fully loaded
 *  @constructor
 *  @author Ethan Oguya
 *  @param driver {webdriver} - The selenium browser driver object
 *  @param timeout {number} (not required) - The maximum wait time
 */
exports.waitForPageLoad = function(driver, timeout = 10000) {
    var oldHtmlElement;

    // check the arguments
    if (typeof timeout !== 'number' || timeout <= 0) {
        throw new TypeError('The argument timeout must be a integer > 0');
    }

    // get the html tag on the old page
    oldHtmlElement = driver.findElement(By.tagName('html'));

    // wait until the function returns true or the timeout expires
    driver.wait(function () {
        // get the html tag on the (eventually already) new page
        var newHtmlElement = driver.findElement(By.tagName('html')),
            newHtmlElementId = newHtmlElement.getId(),
            oldHtmlElementId = oldHtmlElement.getId();

        // compare the id of the html tag on the page with the one we just got
        //  and if it's no longer the same one, we must be on the new page.
        return oldHtmlElementId !== newHtmlElementId;
    }, timeout);
}

exports.loadPage = async function(pageURL, disableNotifications){
    var options = new chrome.Options();
    //Disable browser notifications so as not to disrupt the test cases
    let driver;
    if(disableNotifications){
        options.setUserPreferences({'profile.default_content_setting_values.notifications': 2});
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    }
    //Login
    let loadPage = ()=>{
        return driver.get(process.env.TEST_HOST)
        .then(async function(){
            await driver.get(process.env.TEST_HOST);
            await driver.wait(until.elementLocated(By.id('username')));
            await driver.wait(until.elementLocated(By.id('password')));
            await driver.findElement(By.id('username')).click();
            await driver.findElement(By.id('username')).sendKeys('ethan', Key.RETURN);
            await driver.findElement(By.id('password')).click();
            await driver.findElement(By.id('password')).sendKeys('password', Key.RETURN);
            await driver.get(`${process.env.TEST_HOST}${pageURL}`);
            return driver;
        })
        .catch(async function(e){
            console.log(e);
            options = new chrome.Options();
            options.setUserPreferences({'profile.default_content_setting_values.notifications': 2}); 
            driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
            loadPage();
            return driver;
        });
    }
    await loadPage();
}

/**
 *  Finds and clicks the element until successful. Was created to prevent
 *  stale element reference error from breaking the test cases.
 *  @constructor
 *  @author Ethan Oguya
 *  @param driver {webdriver} - The selenium browser driver object
 *  @param selector {By} - The maximum wait time
 */
exports.findAndClickElement = (driver, selector) => driver.findElement(selector).click()
.then(elem => elem).catch(() => exports.findAndClickElement(driver, selector));

exports.findAndClickCompleteTableRow = (driver, selector, timeout = 60000)=>{
    driver.wait(until.elementLocated(selector), timeout);
    return driver.findElement(selector)
    .then(element => {
        if(typeof(element) !== "undefined")
            return {element:element, textArray: exports.getTextArray(element)}
        return;
    })
    .then(async function(result){
        let emptyDataCount=0;
        for(let text of await result.textArray)
            if(text == "-")
                emptyDataCount+=1;
        if(emptyDataCount == 0){
            result.element.click();
            result.element.getText();
            return result
        }
        return;
    })
    .catch(e => {
        console.log(e)
        exports.findAndClickCompleteTableRow(driver, selector, timeout)
    })
}

exports.findElementsAndGetText = (driver, selector) => driver.findElements(selector)
.then(async(elements) => {
    let textArray = []
    for(element of elements)
        textArray.push(await element.getText());
    return textArray
}).catch(() => exports.findElementsAndGetText(driver, selector));

exports.findElementAndGetText = (driver, selector) => driver.findElement(selector)
.then(element => element.getText()).catch(() => exports.findElementAndGetText(driver, selector));

exports.findElementAndGetTextArray = (driver, selector) => driver.findElement(selector)
.then(element => element.getText().then(text => text.split(" ")).catch(e => Error(e)))
.catch(() => exports.findElementAndGetTextArray(driver, selector));

exports.findCharacterAndSplit = (array, character) => array.map(string => {
    if(string.includes(character))
        return string.split(character)
    return string
});

// exports.getTextArray = (element) => element.getText().then(text => {
//     let textArray = text.split(" ")
//     let breakIndex = textArray.findIndex(item => item.includes("\n"))
//     if(breakIndex !== ""){
//         textArray.push(...textArray[breakIndex].split("\n"))
//     }
//     let indexToRemove = textArray.findIndex(item => item == "-" || item.includes("\n"))
//     do{
//         textArray.splice(indexToRemove, indexToRemove)
//         indexToRemove = textArray.findIndex(item => item == "-" || item.includes("\n"))
//     }
//     while(indexToRemove !== -1)
//     return textArray
// }).catch(exports.getTextArray(element))

exports.getTextArray = (element) => typeof(element) !== "undefined" ?
element.getText().then(text => text.split(" "))
.catch(() => exports.getTextArray()) : null