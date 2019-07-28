/* Javascript for StudentQuestionsBankXBlock. Integrated with SJFB 
 *
 * This script loads a questionary and displays it to the student in order to get its answers
 * Refer to student_questions_bank.js for more details
 * 
 * For handlerUrlCompleteQuestions function (complete_questions in python)
 * The returned JSON format (on submit) corresponds to a normal JSON (see studio_view), but
 * rather than using selected as the right answer, it simbolizes student's answer
 *
 */

function StudentQuestionsBankXBlock(runtime, element) {

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

    var handlerUrlCompleteQuestions = runtime.handlerUrl(element, 'complete_questions');
    var handlerUrlLoadQuestionary = runtime.handlerUrl(element, 'load_questionary');

    // This view should be able to:
    // *A. download an specific random generated questionary
    //     - apparently theres no need for ID, rather ONLY qst
    //     - save on user_state qst+ans but only send qst
    // *B. Display questions to student
    // *C. return answers to python
    //--in python
    // *A. gather answers
    // *B. grade answers
    // *C. return grading as a result to JS petition (C)
    // *D. save qst+answers and score into user_state
    //     - put hasCompleted=True
    // *E. save qst+answers, score and user_name into user_state_summ

    //generates the form HTML
    function generateForm(formID) {

        //empty out the preview area
        $("#sjfb-fields").empty();

        $.ajax({
            type: "POST",
            url: handlerUrlLoadQuestionary,
            data: formID,
            dataType: 'json',
            success: function (data) {
                if (!data.length == 0) {
                    //go through each saved field object and render the form HTML
                    $.each(data, function (k, v) {
                        var fieldType = v['type'];

                        //Add the field
                        $('#sjfb-fields').append(addFieldHTML(fieldType));
                        var $currentField = $('#sjfb-fields .sjfb-field').last();

                        //Add the label
                        $currentField.find('label').text(v['label']);

                        //Any choices?
                        if (v['choices']) {
                            var uniqueID = Math.floor(Math.random() * 999999) + 1;

                            $.each(v['choices'], function (k, v) {
                                if (fieldType == 'radio') {
                                    var choiceHTML = '<label><input type="radio" name="radio-' + uniqueID + '" value="' + v['label'] + '">' + v['label'] + '</label>';
                                    $currentField.find(".choices").append(choiceHTML);
                                } else if (fieldType == 'checkbox') {
                                    var choiceHTML = '<label><input type="checkbox" name="checkbox-' + uniqueID + '" value="' + v['label'] + '">' + v['label'] + '</label>';
                                    $currentField.find(".choices").append(choiceHTML);
                                }
                            });
                        }

                        //Is it required?
                        if (v['req']) {
                            if (fieldType == 'radio') { $currentField.find("input").prop('required', true).addClass('required-choice') }
                            $currentField.addClass('required-field');
                        }
                    });
                } else {
                    $('#sjfb-fields').append('<p>El exámen no se encuentra disponible.</p>');
                    $("#btnSubmit").attr("disabled", true);
                }
            }
        });
    }

    $(function ($) {
        //TODO: use this form id to manage questionaries. Not implemented yet.
        var formID = '1';
        generateForm(formID);

        $("#sjfb-sample").on("submit", function () {
            event.preventDefault();

            //Loop through fields and save field data to array
            var fields = [];

            $('.sjfb-field').each(function () {
                var $this = $(this);

                if ($this.find('.choices').length >= 1) {
                    var choices = [];

                    $this.find('.choices input').each(function () {
                        var $thisChoice = $(this);
                        var choiceSel = $thisChoice.is(":checked") ? 1 : 0;

                        choices.push({
                            sel: choiceSel
                        });
                    });
                }

                fields.push({
                    choices: choices
                });
            });

            var data = JSON.stringify(fields);

            $.ajax({
                type: "POST",
                url: handlerUrlCompleteQuestions,
                data: data,
                dataType: 'json',
                success: function (data) {
                    //empty out the preview area
                    $("#sjfb-fields").empty();

                    score = data;

                    $('#sjfb-fields').append('<p>Tu evaluación es ' + score['score'] + ' de 100.</p>');
                    $("#btnSubmit").attr("disabled", true);
                }
            });
        });
    });

    //HTML templates for rendering frontend form fields
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
