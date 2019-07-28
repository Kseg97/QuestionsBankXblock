/* Javascript for StudioAnalytics.
 *
 * This script 
 */

function StudioAnalytics(runtime, element) {

    // Immediately-invoked function expression
    (function () {
        // Load the script
        var script = document.createElement("SCRIPT");
        script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js';
        script.type = 'text/javascript';
        script.onload = function () {
            var $ = window.jQuery;
            // Use $ here...
        };
        document.getElementsByTagName("head")[0].appendChild(script);
    })();

    var handlerUrlLoadAnalytics = runtime.handlerUrl(element, 'load_analytics');

    //generates the form HTML
    function generateUserAnalytic(questionary, answers) {

        //empty out the preview area
        $("#user-analytics").empty();

        if (!questionary.length == 0) {
            //go through each saved field object and render the form HTML
            for (i = 0; i < questionary.length; i++) {
                var fieldType = questionary[i].type;

                //Add the field
                $('#user-analytics').append(addFieldHTML(fieldType));
                var $currentField = $('#user-analytics .sjfb-field').last();

                //Add the label
                $currentField.find('label').text(questionary[i].label);

                //Any choices?
                if (questionary[i].choices) {
                    var uniqueID = Math.floor(Math.random() * 999999) + 1;

                    for (j = 0; j < questionary[i].choices.length; j++) {
                        var choice = questionary[i].choices[j];
                        var checked = answers[i].choices[j].sel;

                        if (fieldType == 'radio') {
                            var choiceHTML = checked == 1 ? '<label><input type="radio" name="radio-' + uniqueID + '" value="' + choice.label + '" checked>' + choice.label + '</label>' :
                                '<label><input type="radio" name="radio-' + uniqueID + '" value="' + choice.label + '">' + choice.label + '</label>';
                            $currentField.find(".choices").append(choiceHTML);
                        } else if (fieldType == 'checkbox') {
                            var choiceHTML = checked == 1 ? '<label><input type="checkbox" name="checkbox-' + uniqueID + '" value="' + choice.label + '">' + choice.label + '</label>' :
                                '<label><input type="checkbox" name="checkbox-' + uniqueID + '" value="' + choice.label + '">' + choice.label + '</label>';
                            $currentField.find(".choices").append(choiceHTML);
                        }
                    }
                }

                //Is it required?
                if (questionary[i].req) {
                    if (fieldType == 'radio') { $currentField.find("input").prop('required', true).addClass('required-choice') }
                    $currentField.addClass('required-field');
                }
            }
        }
        $(':radio,:checkbox').click(function () {
            return false;
        });
    }

    function generateTable(data) {
        var number_of_rows = data.length;

        var number_of_cols = 3;
        var table_body = '<table border="1">';

        for (var i = 0; i < number_of_rows; i++) {
            user_data = JSON.parse(data[i]);
            table_body += '<tr>';
            for (var j = 0; j < number_of_cols; j++) {
                table_body += '<td>';
                if (j == 0) table_body += user_data.user_full_name;
                if (j == 1) table_body += user_data.score;
                if (j == 2) table_body += '<button id="view-' + i + '" class="view-user">ver</button>';
                table_body += '</td>';
            }
            table_body += '</tr>';
        }
        table_body += '</table>';
        $('#tableDiv').html(table_body);

        $(".view-user").click(function () {
            var id = this.id.split('-')[1];
            var user_data = JSON.parse(data[id]);
            // alert(JSON.stringify(user_data))
            generateUserAnalytic(user_data.student_questionary, user_data.student_answers);
        })
    }

    $(function ($) {
        formID = '1'

        $.ajax({
            type: "POST",
            url: handlerUrlLoadAnalytics,
            data: formID,
            dataType: 'json',
            success: function (data) {
                generateTable(data)
            }
        })

    });

    function addFieldHTML(fieldType) {

        var uniqueID = Math.floor(Math.random() * 999999) + 1;

        switch (fieldType) {
            case 'radio':
                return '' +
                    '<div id="sjfb-' + uniqueID + '" class="sjfb-field sjfb-radio">' +
                    '<label></label>' +
                    '<div class="choices choices-radio"></div>' +
                    '</div>';

            case 'checkbox':
                return '' +
                    '<div id="sjfb-checkbox-' + uniqueID + '" class="sjfb-field sjfb-checkbox">' +
                    '<label class="sjfb-label"></label>' +
                    '<div class="choices choices-checkbox"></div>' +
                    '</div>';
        }
    }
}
