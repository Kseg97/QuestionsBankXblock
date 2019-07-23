/* Javascript for StudioQuestionsBankXBlock. Integrated with SJFB 
 *
 * Simple Jquery Form Builder (SJFB)
 * Copyright (c) 2015 Brandon Hoover, Hoover Web Development LLC (http://bhoover.com)
 * http://bhoover.com/simple-jquery-form-builder/
 * SJFB may be freely distributed under the included MIT license (license.txt).
 *
 * This is a modified version of this component, adapted to support ICFES-like questions.
 * For support, contact: camilosegura@unicauca.edu.co.
 * SELECTED is a reference to the answers in this modification (of the original component).
 * Every time you see 'selected' (i.e. v['sel']), means an answer to be described near the
 * option (it doesn't care if its multiple or single option).
 * 
 * For handlerUrlCreateBank function (create_bank in python)
 * A returned JSON example is:
 *  [
      {"name":"formID","value":"1"},
      {"name":"formFields","value": [
        {
          "type":"radio",
          "label":"Enunciado de la pregunta",
          "req":1,
          "choices": [ 
            {"label":"Opción 1","sel":1},
            {"label":"Opción 2","sel":0}
          ]
        }
      ]},
      {"name":"num_questions","value":"1"},
    ]
 *
 * Where at least one option mut be provided (required) and the first choice (option 1) is 
 * the answer.
 */
function StudioQuestionsBankXBlock(runtime, element) {
    //TODO: create num_questions field and input

    // Handlers used to request and communicate with python script
    var handlerUrlCreateBank = runtime.handlerUrl(element, 'create_bank');
    var handlerUrlLoadBank = runtime.handlerUrl(element, 'load_bank');

    //TODO: change formID with bank ID and userID (teacher)
    //Loads a saved form from our global variable 'questions' into the builder
    function loadForm(formID) {
        $.ajax({
            type: "POST",
            url: handlerUrlLoadBank,
            data: formID,
            dataType: 'json',
            success: function (data) {
                // TODO: Handle data={}, allow to import JSON and also load from DB if any.

                //go through each saved field object and render the builder
                $.each(data, function (k, v) {
                    console.log(JSON.stringify(v))
                    //Add the field
                    //Add the field
                    $(addField(v['type'])).appendTo('#form-fields').hide().slideDown('fast');
                    var $currentField = $('#form-fields .field').last();

                    //Add the label
                    $currentField.find('.field-label').val(v['label']);

                    //Is it required?
                    if (v['req']) {
                        requiredField($currentField.find('.toggle-required'));
                    }

                    //Any choices?
                    if (v['choices']) {
                        $.each(v['choices'], function (k, v) {
                            //add the choices
                            $currentField.find('.choices ul').append(addChoice());

                            //Add the label
                            $currentField.find('.choice-label').last().val(v['label']);

                            //Is it selected?
                            if (v['sel']) {
                                selectedChoice($currentField.find('.toggle-selected').last());
                            }
                        });
                    }

                });

                $('#form-fields').sortable();
                $('.choices ul').sortable();
            }
        });
    }

    //TODO: change formID with bank ID and userID (teacher)
    $(function ($) {
        //If loading a saved form from your database, put the ID here. Example id is "1".
        var formID = '1';

        //TODO: load saved form (bank)
        loadForm(formID);

        //Saving form
        $("#sjfb").submit(function (event) {
            event.preventDefault();

            //Loop through fields and save field data to array
            var fields = [];

            $('.field').each(function () {
                var $this = $(this);

                //field type
                var fieldType = $this.data('type');

                //field label
                var fieldLabel = $this.find('.field-label').val();

                //field required
                var fieldReq = $this.hasClass('required') ? 1 : 0;

                //check if this field has choices
                if ($this.find('.choices li').length >= 1) {

                    var choices = [];

                    $this.find('.choices li').each(function () {

                        var $thisChoice = $(this);

                        //choice label
                        var choiceLabel = $thisChoice.find('.choice-label').val();

                        //choice selected
                        var choiceSel = $thisChoice.hasClass('selected') ? 1 : 0;

                        choices.push({
                            label: choiceLabel,
                            sel: choiceSel
                        });

                    });
                }

                fields.push({
                    type: fieldType,
                    label: fieldLabel,
                    req: fieldReq,
                    choices: choices
                });

            });

            num_questions = $('#num_questions').val();

            //SAVE FORM (TO DATABASE OR SCOPE)
            //TODO: change formID to BankID and UserID
            var data = JSON.stringify([
                { "name": "formID", "value": formID }, 
                { "name": "formFields", "value": fields },
                { "name": "num_questions", "value": num_questions }, 
            ]);

            //alert(data);
            $.ajax({
                type: "POST",
                url: handlerUrlCreateBank,
                data: data,
                dataType: 'json',
                success: function (msg) {
                    console.log(msg);
                    $('.alert').removeClass('hide');
                    $("html, body").animate({ scrollTop: 0 }, "fast");

                    //TODO: remove when stable
                    $('.alert textarea').val(JSON.stringify(fields));
                }
            });
        });

        //Adds new field with animation
        $("#add-field a").click(function () {
            event.preventDefault();
            $(addField($(this).data('type'))).appendTo('#form-fields').hide().slideDown('fast');
            $('#form-fields').sortable();
        });

        //Removes fields and choices with animation
        $("#sjfb").on("click", ".delete", function () {
            if (confirm('Are you sure?')) {
                var $this = $(this);
                $this.parent().slideUp("slow", function () {
                    $this.parent().remove()
                });
            }
        });

        //Makes fields required
        $("#sjfb").on("click", ".toggle-required", function () {
            requiredField($(this));
        });

        //Makes choices selected
        $("#sjfb").on("click", ".toggle-selected", function () {
            selectedChoice($(this));
        });

        //Adds new choice to field with animation
        $("#sjfb").on("click", ".add-choice", function () {
            $(addChoice()).appendTo($(this).prev()).hide().slideDown('fast');
            $('.choices ul').sortable();
        });
    });


    //Add field to builder
    function addField(fieldType) {

        var hasRequired, hasChoices;
        var includeRequiredHTML = '';
        var includeChoicesHTML = '';

        switch (fieldType) {
            case 'radio':
                hasRequired = true;
                hasChoices = true;
                break;
            case 'checkbox':
                hasRequired = false;
                hasChoices = true;
                break;
        }

        if (hasRequired) {
            includeRequiredHTML = '' +
                '<label>¿Es requerido? ' +
                '<input class="toggle-required" type="checkbox">' +
                '</label>'
        }

        if (hasChoices) {
            includeChoicesHTML = '' +
                '<div class="choices">' +
                '<ul></ul>' +
                '<button type="button" class="add-choice">Agregar opción</button>' +
                '</div>'
        }

        return '' +
            '<div class="field" data-type="' + fieldType + '">' +
            '<button type="button"  class="delete">Eliminar pregunta</button>' +
            '<h3>' + fieldType + '</h3>' +
            '<label>Enunciado:' +
            '<input type="text" class="field-label">' +
            '</label>' +
            includeRequiredHTML +
            includeChoicesHTML +
            '</div>'
    }

    //Make builder field required
    function requiredField($this) {
        if (!$this.parents('.field').hasClass('required')) {
            //Field required
            $this.parents('.field').addClass('required');
            $this.attr('checked', 'checked');
        } else {
            //Field not required
            $this.parents('.field').removeClass('required');
            $this.removeAttr('checked');
        }
    }

    function selectedChoice($this) {
        if (!$this.parents('li').hasClass('selected')) {

            //Only checkboxes can have more than one item selected at a time
            //If this is not a checkbox group, unselect the choices before selecting
            if ($this.parents('.field').data('type') != 'checkbox') {
                $this.parents('.choices').find('li').removeClass('selected');
                $this.parents('.choices').find('.toggle-selected').not($this).removeAttr('checked');
            }

            //Make selected
            $this.parents('li').addClass('selected');
            $this.attr('checked', 'checked');

        } else {

            //Unselect
            $this.parents('li').removeClass('selected');
            $this.removeAttr('checked');

        }
    }

    //Builder HTML for select, radio, and checkbox choices
    function addChoice() {
        return '' +
            '<li>' +
            '<label>Opción: ' +
            '<input type="text" class="choice-label">' +
            '</label>' +
            '<label>¿Es la respuesta? ' +
            '<input class="toggle-selected" type="checkbox">' +
            '</label>' +
            '<button type="button" class="delete">Delete Choice</button>' +
            '</li>'
    }
}
