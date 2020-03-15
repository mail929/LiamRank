/**
 * file:        ranker.js
 * description: Contains functions for the team ranking page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-03-13
 */

// HTML template for a result option
const RESULT_BLOCK = "\
    <div id=\"team_NUM\" class=\"pit_option\" onclick=\"open_team('NUM')\">\
        <span class=\"long_option_number\">TEXT</span>\
    </div>"

const CONTENTS = "<h2 id=\"value\"></h2>"
const BUTTON = "\
    <h4 class=\"input_label\">Sort by key:</h4>\
    <select class=\"wr_dropdown\" id=\"key_selector\" onchange=\"select()\">\
    </select>\
    <h4 class=\"input_label\">Sort numeric values using:</h4>\
    <div class=\"wr_select\" id=\"type_form\">\
        <span class=\"wr_select_option selected\" id=\"type_form-1\" onclick=\"select_option('type_form', '1')\">\
            <label>Mean</label>\
        </span>\
        <span class=\"wr_select_option\" id=\"type_form-2\" onclick=\"select_option('type_form', '2'); collect_results(); select()\">\
            <label>Median</label>\
        </span>\
        <span class=\"wr_select_option\" id=\"type_form-3\" onclick=\"select_option('type_form', '3'); collect_results(); select()\">\
            <label>Mode</label>\
        </span>\
        <span class=\"wr_select_option\" id=\"type_form-4\" onclick=\"select_option('type_form', '4'); collect_results(); select()\">\
            <label>Min</label>\
        </span>\
        <span class=\"wr_select_option\" id=\"type_form-5\" onclick=\"select_option('type_form', '5'); collect_results(); select()\">\
            <label>Max</label>\
        </span>\
    </div>\
    <div class=\"wr_checkbox\" id=\"reverse-container\" onclick=\"check('reverse'); build_team_list()\">\
        <input type=\"checkbox\" onclick=\"check('reverse'); build_team_list()\" id=\"reverse\" name=\"reverse\">\
        <label for=\"reverse\" onclick=\"check('reverse'); build_team_list()\">Reverse Order</label>\
    </div>"
    
const DROPDOWN_OP = "<option class=\"wr_dropdown_op\" value=\"NAME\">NAME</option>"

var keys = {}
var teams = {}
var totals = []
var config
var selected = ""

/**
 * function:    avg_results
 * parameters:  results container, column to sum
 * returns:     average of all results
 * description: Average all the results for a given column.
 */
function avg_results(results, key)
{
    let values = []
    Object.keys(results).forEach(function (name, index)
    {
        values.push(results[name][key])
    })
    switch (get_type(key))
    {
        // compute mode for non-numerics
        case "checkbox":
        case "select":
        case "dropdown":
        case "unknown":
            let counts = {}
            let maxVal = values[0]
            values.forEach(function (val, index)
            {
                // increase count of value if it exists already
                if (Object.keys(counts).includes(val)) counts[val]++
                // start count of value if it has not been added yet
                else counts[val] = 1

                // if this was a most frequent increase the max count
                if (counts[val] > counts[maxVal]) maxVal = val
            })
            return maxVal
        // compute average for numbers
        case "string":
        case "text":
            return "---"
        case "counter":
        case "number":
        default:
            switch (get_selected_option("type_form"))
            {
                // median
                case 1:
                    let sorted = values.sort()
                    console.log(sorted)
                    return sorted[Math.floor(sorted.length / 2)]
                // mode
                case 2:
                    let counts = {}
                    let maxVal = values[0]
                    values.forEach(function (val, index)
                    {
                        // increase count of value if it exists already
                        if (Object.keys(counts).includes(val)) counts[val]++
                        // start count of value if it has not been added yet
                        else counts[val] = 1
        
                        // if this was a most frequent increase the max count
                        if (counts[val] > counts[maxVal]) maxVal = val
                    })
                    return maxVal
                // min
                case 3:
                    return Math.min(... values)
                // max
                case 4:
                    return Math.max(... values)
                // mean
                case 0:
                default:
                    return values.reduce((a, b) => a + b, 0) / values.length
            }
    }
    return 0
}

/**
 * function:    get_team_results
 * parameters:  results to filter, team number
 * returns:     list of results for team
 * description: Get all results for the current team.
 */
function get_team_results(results, team)
{
    let files = Object.keys(results)
    let team_results = {}
    files.forEach(function (file, index)
    {
        let parts = file.split("-")
        let number = parseInt(parts[parts.length - 1])
        // determine files which start with the desired type
        if (file.startsWith(prefix) && number == team)
        {
            team_results[file] = results[file]
        }
    })
    return team_results
}

/**
 * function:    collect_results
 * parameters:  none
 * returns:     none
 * description: Collects all desired results from file, then add to screen.
 */
function collect_results()
{
    let unsorted = {}
    Object.keys(localStorage).forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            let parts = file.split("-")
            let team = parts[parts.length - 1]
            if (!Object.keys(teams).includes(team))
            {
                teams["#" + team] = {}
            }
            unsorted[file] = JSON.parse(localStorage.getItem(file))
        }
    })

    let num_results = Object.keys(unsorted).length
    if (num_results == 0)
    {
        return 0
    }

    keys = Object.keys(unsorted[Object.keys(unsorted)[0]]).filter(key => !["string", "text", "unknown"].includes(get_type(key)))
    keys.forEach(function (key, index)
    {
        totals[key] = avg_results(unsorted, key)
    })
    Object.keys(teams).forEach(function (team, index)
    {
        let team_results = get_team_results(unsorted, team.substr(1))
        keys.forEach(function (key, index)
        {
            teams[team][key] = avg_results(team_results, key)
        })
    })

    return num_results
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select result pane with results.
 */
function build_team_list()
{
    let team_nums = Object.keys(teams)
    document.getElementById("option_list").innerHTML = ""
    if (document.getElementById("reverse").checked)
    {
        team_nums = team_nums.reverse()
    }
    team_nums.forEach(function (team, index)
    {
        let select = document.getElementById("key_selector")
        let val = get_value(keys[select.selectedIndex], teams[team][keys[select.selectedIndex]])
        document.getElementById("option_list").innerHTML += RESULT_BLOCK.replace(/NUM/g, team)
                                                                        .replace(/TEXT/g, (index+1) + ": " + team.substr(1) + " - " + val)
    })
}

/**
 * function:    get_type
 * parameters:  name of result
 * returns:     type of input
 * description: Determines the type of input that created the given result.
 */
function get_type(key)
{
    var type = "unknown"
    config.pages.forEach(function (page, index)
    {
        page["columns"].forEach(function (column, index)
        {
            column["inputs"].forEach(function (input, index)
            {
                if (input.id == key)
                {
                    type = input.type
                }
            })
        })
    })
    return type
}

/**
 * function:    get_name
 * parameters:  name of result
 * returns:     name of input
 * description: Determines the name of input that created the given result.
 */
function get_name(key)
{
    var name = key.replace(/_/g, " ")
    config.pages.forEach(function (page, index)
    {
        page["columns"].forEach(function (column, index)
        {
            column["inputs"].forEach(function (input, index)
            {
                if (input.id == key)
                {
                    name = input.name
                }
            })
        })
    })
    return name
}

/**
 * function:    sort_teams
 * parameters:  key index to sort by
 * returns:     none
 * description: Sorts the teams by a given key.
 */
function sort_teams(index)
{
    let sort_by = keys[index]
    let unsorted = teams
    teams = {}
    
    // sort by given key
    Object.keys(unsorted).sort(function (a, b) {
        return unsorted[b][sort_by] < unsorted[a][sort_by] ? -1
                : unsorted[b][sort_by] > unsorted[a][sort_by] ? 1
                : 0
    }).forEach(function (key) {
        teams[key] = unsorted[key]
    })
}

/**
 * function:    select
 * parameters:  none
 * returns:     none
 * description: Responds to new key being selected by updating team order.
 */
function select()
{
    let select = document.getElementById("key_selector")
    sort_teams(select.selectedIndex)
    document.getElementById("value").innerHTML = "Team: " + selected.substr(1) + "<br>"
    document.getElementById("value").innerHTML += select.value + ": " + teams[selected][keys[select.selectedIndex]] + "<br>"
    let val = get_value(keys[select.selectedIndex], totals[keys[select.selectedIndex]])
    document.getElementById("value").innerHTML += "Overall: " + val
    build_team_list()
}

/**
 * function:    open_team
 * parameters:  team number
 * returns:     none
 * description: Updates the selected team.
 */
function open_team(team_num)
{
    selected = team_num
    let select = document.getElementById("key_selector")
    document.getElementById("value").innerHTML = select.value + ": " + teams[selected][keys[select.selectedIndex]] + "<br>"
    document.getElementById("value").innerHTML += "Average: " + totals[keys[select.selectedIndex]].toFixed(2)

    document.getElementById("team_" + team_num).classList.add("selected")
    Object.keys(teams).forEach(function (team, index)
    {
        if (document.getElementById("team_" + team).classList.contains("selected"))
        {
            document.getElementById("team_" + team).classList.remove("selected")
        }
    })
}

/**
 * function:    fill_dropdown
 * parameters:  none
 * returns:     none
 * description: Populates key selection dropdown with all key names.
 */
function fill_dropdown()
{
    let options = ""
    keys.forEach(function (key, index)
    {
        options += DROPDOWN_OP.replace(/NAME/g, get_name(key))
    })
    document.getElementById("key_selector").innerHTML = options
}

/**
 * function:    get_value
 * parameters:  name of result, raw value stored
 * returns:     human readable result value
 * description: Translates less human readable results to more.
 */
function get_value(key, value)
{
    switch (get_type(key))
    {
        case "select":
        case "dropdown":
            let option = ""
            config.pages.forEach(function (page, index)
            {
                page["columns"].forEach(function (column, index)
                {
                    column["inputs"].forEach(function (input, index)
                    {
                        if (input.id == key)
                        {
                            option = input.options[value]
                        }
                    })
                })
            })
            return option
        case "checkbox":
            return value ? "Yes" : "No"
        case "string":
        case "text":
            return value
        case "number":
        case "counter":
        default:
            if (typeof value === "number" && !key.startsWith("meta")) return value.toFixed(2)
            else return value
    }
}

// read parameters from URL
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const prefix = type + "-" + event_id + "-"

// get the appropriate configuration for the results
fetch("config/scout-config.json")
    .then(response => {
        return response.json()
    })
    .then(data => {
        data.forEach(function (mode, index)
        {
            if (mode.id == type)
            {
                config = data[index]
            }
        })

        document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/BUTTONS/g, BUTTON)
        if (collect_results() > 0)
        {
            document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/CONTENTS/g, CONTENTS)
            fill_dropdown()
            selected = Object.keys(teams)[0]
            select()
        }
        else
        {
            document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/CONTENTS/g, "<h2>No Results Found</h2>")
            document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/BUTTONS/g, "")
        }
    })
    .catch(err => {
        console.log("Error config file")
    })