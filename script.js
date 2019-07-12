/*
 *  this file is part of startpage
 *  Copyright (C) 2019 contact@t3Y.eu
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * Usersettings
 * default usersettings are overridden if localStorage contains settings
 */
var userSettings = {
shortcuts: [
    ["^gmail$", "https://mail.google.com/mail/"],
], 
background: "default"
};
if (localStorage.getItem("userSettings") != undefined) {
    let storageContent = localStorage.getItem("userSettings");
    userSettings = JSON.parse(storageContent);
}


/*
 * set background image if necessary
 * otherwise the default css rule will be used
 */
if (userSettings.background != "default") {
    document.getElementsByTagName("html")[0].style.backgroundImage = 'url("' + userSettings.background + '")';
}


/*
 * load the old elements into the DOM & script
 * the datalist allows suggestions to appear under the seachbar
 * the javascript object allows tab completion
 */
var suggestionList = loadSuggestionData();

/*
 * load the noteList
 * notes are shown when the command /note is used
 */
loadNoteList();


/*
 * track searchbar content
 * if searchbar content matches the regex from a shortcut, replace it
 */
document.getElementById("searchbar").addEventListener("input", function() {
    var v = this.value;
    userSettings.shortcuts.forEach(function(s) {
        var r = new RegExp(s[0], "i");
        v = v.replace(r, s[1]);
    });
    //notification
    if (this.value != v) {
        notify(this.value + " -> " + v);
    }
    this.value = v;
}, false);

/*
 * listen for keypresses
 * if the keypress is tab, cycle through the search suggestions
 */
var tabPresses = 0;
var filteredList = "";
var initialValue = "";
document.addEventListener('keydown', function(event){
    document.getElementById("searchbar").focus();
    var keycode = event.keyCode;


    if (keycode == 9) {
        event.preventDefault();

        //autocomplete
        var bar = document.getElementById("searchbar");
        var content = bar.value;
        if (tabPresses == 0) {
            initialValue = content;
            filteredList = suggestionList.filter(function(element){
                return element.toLowerCase().indexOf(content.toLowerCase()) > -1;
            });
            if (filteredList.length < 1) filteredList = [content];
        }
        //wrap around
        if (tabPresses == filteredList.length) tabPresses = 0;
        bar.value = filteredList[tabPresses];

        //notification
        notify(initialValue + " -> " + bar.value);

        tabPresses++;

        bar.focus();
    } else {
        tabPresses = 0;
    }
});

/*
 * wake up the datalist
 * seems necessary for the suggestions to appear under the searchbar
 */
document.getElementById("searchbar").click();

/*
 * submit() gets called when the searchbar content is submitted by hitting enter
 * the function prevents the default behaviour and parses the searchbar content
 * to execute commands and urlify urly-looking strings
 */
function submit(e) {
    e.preventDefault();
    var target = (document.getElementById("searchbar").value);

    //commands
    if (target.indexOf("/save ") == 0) {
        //save a string
        target = target.split("/save ")[1];
        if (suggestionList.indexOf(target) == -1) {
            suggestionList.push(target);
        }
        localStorage.setItem("autocompleteData", JSON.stringify(suggestionList));
        refreshSuggestionData();
        document.getElementById("searchbar").value = "";
        notify("Saved " + target);
        
    } else if (target.indexOf("/remove ") == 0) {
        //remove a saved string
        target = target.split("/remove ")[1];
        var index = suggestionList.indexOf(target);
        if (index != -1) {
            suggestionList.splice(index, 1);
        }
        localStorage.setItem("autocompleteData", JSON.stringify(suggestionList));
        refreshSuggestionData();
        document.getElementById("searchbar").value = "";
        notify("Deleted " + target);

    } else if (target === "/help") {
        //display help & command list
        document.getElementById("helppage").style.display = "inline-block";
        document.getElementById("searchbar").value = "";
        notify("Displaying Help");

    } else if (target === "/close") {
        //close all textboxes
        var objs = document.getElementsByClassName("textbox");
        for (let i=0; i<objs.length; i++) {
            objs[i].style.display = "none";
        }
        document.getElementById("searchbar").value = "";
        notify("Closed all text boxes");

    } else if (target === "/history") {
        //display all suggestion data in a textbox
        document.getElementById("general").innerHTML = "<h3>history</h3>";
        document.getElementById("general").style.display = "inline-block";
        for (let i=0; i<suggestionList.length; i++) {
            document.getElementById("general").innerHTML += suggestionList[i] + '<br>';
        }
        document.getElementById("searchbar").value = "";
        notify("Displaying history");

    } else if (target === "/note") {
        document.getElementById("noteList").style.display = "inline-block";
        document.getElementById("searchbar").value = "";
        notify("Displaying note-list");

    } else if (target.indexOf("/note ") == 0) {
        //notes stuff - allows adding and removing notes as well as removing all notes at once
        target = target.split("/note")[1];
        var noteList = document.getElementById("noteListContent");
        if (target.indexOf(" add ") == 0) {
            let timestamp = Math.round(new Date().getTime() / 1000);
            noteList.innerHTML = '<div class="noteElement" id="' + timestamp + '"><span class="dateId">ID: ' + timestamp + "</span><br>" + target.substring(4) + "</div>" + noteList.innerHTML;
            localStorage.setItem("noteListData", noteList.innerHTML);
            notify("Added an item to the note-list");
        } else if (target.indexOf(" remove ") == 0) {
            try {
                let id = target.split(" remove ")[1];
                document.getElementById(id).outerHTML = "";
                localStorage.setItem("noteListData", noteList.innerHTML);
                notify("Removed " + id + " from the note-list");
            } catch (err) {
                notify("Error: invalid ID");
            }
        } else if (target.indexOf(" reset") == 0) {
            noteList.innerHTML = "";
            localStorage.setItem("noteListData", noteList.innerHTML);
            notify("Reset the note-list");
        }
        document.getElementById("noteList").style.display = "inline-block";
        document.getElementById("searchbar").value = "";

    } else if (target.indexOf("/shortcut") == 0) {
        //add and delete shortcuts
        target = target.split("/shortcut")[1];
        if (target.indexOf(" add ") == 0) {
            let elements = target.substring(5).split("=>");
            if (elements.length == 2) {
                userSettings.shortcuts.push([elements[0], elements[1]]);
                localStorage.setItem("userSettings", JSON.stringify(userSettings));
                notify("Added shortcut " + elements[0] + " to the shortcut list");
            } else {
                notify("Error: invalid argument");
            }
        } else if (target.indexOf(" remove ") == 0) {
            try {
                let shortcut = target.split(" remove ")[1];
                for (let i=0; i<userSettings.shortcuts.length; i++) {
                    if (userSettings.shortcuts[i].indexOf(shortcut) == 1) {
                        userSettings.shortcuts.splice(i, 1);
                    }

                }
                localStorage.setItem("userSettings", JSON.stringify(userSettings));
                notify("Removed shortcut " + shortcut + " from the shortcut list");
            } catch (err) {
                notify("Error: invalid shortcut");
            }
        } else if (target.indexOf(" reset") == 0) {
            userSettings.shortcuts = [];
            localStorage.setItem("userSettings", JSON.stringify(userSettings));
            notify("Reset shortcuts");
        } 
        document.getElementById("general").innerHTML = "<h3>shortcut list</h3>";
        document.getElementById("general").style.display = "inline-block";
        for (let i=0; i<userSettings.shortcuts.length; i++) {
            document.getElementById("general").innerHTML += userSettings.shortcuts[i][0] + '=>' + userSettings.shortcuts[i][1] + '<br>';
        }
        notify("Displaying shortcut list");

    
        document.getElementById("searchbar").value = "";

    } else if (target.indexOf("/setBackground ") == 0) {
        //changing the background image
        try {
            let url = target.split("/setBackground ")[1];
            userSettings.background = url;
            localStorage.setItem("userSettings", JSON.stringify(userSettings));
            notify("Set background image URL to " + url);
            location.reload();
        } catch (err) {
            notify("Error: no url provided");
        }


    } else {
        //store
        if (suggestionList.indexOf(target) == -1) {
            let aaa = suggestionList.push(target);
        }
        localStorage.setItem("autocompleteData", JSON.stringify(suggestionList));

        //urlify
        if (target.indexOf(".") != -1 && target.indexOf(" ") == -1 && target.indexOf("https://") == -1 && target.indexOf("http://") == -1) {
            target = "https://" + target;
        }

        //go to url
        if (target.indexOf("https://")*target.indexOf("http://") == 0 ) {
            location.href = target;

        //go to ddg
        } else {
            location.href = "https://duckduckgo.com/?q=" + target.replace("/ /g", "+"); 
        }
    }
}

/*
 * allows to update the suggestion list without reloading the page
 */
function refreshSuggestionData() {
    var oldvaluesE = document.getElementById("oldvalues");
    oldvaluesE.innerHTML = "";

    suggestionList.forEach(function(d) {
        var option = document.createElement("option");
        option.value = d;
        oldvaluesE.appendChild(option);        
    });
}

/*
 * As described above, loads suggestion list into the DOM and the script
 */
function loadSuggestionData() {
    if (localStorage.getItem("autocompleteData") == undefined) return [];

    var data = JSON.parse(localStorage.getItem("autocompleteData"));
    var oldvaluesE = document.getElementById("oldvalues");

    data.forEach(function(d) {
        var option = document.createElement("option");
        option.value = d;
        oldvaluesE.appendChild(option);        
    });

    return data;
}

/*
 * load the note list
 * it is stored as plain html and directly added to the div
 */
function loadNoteList() {
    document.getElementById("noteListContent").innerHTML = localStorage.getItem("noteListData");
}

/*
 * displays a notification in the bottom left corner of the page
 */
function notify(string) {
        //notification
        var notifbar = document.getElementById("notification");
        notifbar.style.display = "inline";
        notifbar.innerHTML = string;
        fade("notification");
}

/*
 * the following two functions are supposed to allow the notifications to fade out
 * and completely disappear if the get overriden by another notification
 */
function fade(elementID) {
    var op = 2;
    var element = document.getElementById(elementID);
    fadeImpl(elementID, element.innerHTML, op);
}

function fadeImpl(elementID, elementContent, op) {
    var element = document.getElementById(elementID);
    if (op <= 0.1){
        element.style.display = 'none';
    } else {
        if (element.innerHTML == elementContent) {
            element.style.opacity = op;

            op -= op * 0.1;
            var current = element.innerHTML;
            setTimeout(function(){fadeImpl(elementID, current, op);}, 50);
        } else {
            //die
        }
    }
}

