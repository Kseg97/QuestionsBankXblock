# Questions Bank XBlock
#
# Access information via @XBlock.needs("service_name") at the beggining of the class
# then, and after importing the Scope from xblock.fields, use:
# 
# For UserID:
#   print(self.scope_ids.user_id)
# 
# For any other information:
#   user_service = self.runtime.service(self, 'user')
#   xb_user = user_service.get_current_user()
#   print(xb_user.full_name) # As example to get user (student) name
# 
# Many students can be simulated at Workbench (the place where xblocks are listed)
# by putting '?student=17' at the url (e.g. http://127.0.0.1:8000/scenario/questions_bank.0/?student=17)
# 
# Also, the studio_view is displayed using '/studio_view' in the URL
# (e.g. http://127.0.0.1:8000/scenario/questions_bank.0/studio_view/)
#
# TODO: FormID is desired to serve as a bridge in order to connect different banks (studio_view) 
# and different questionaries (student_view), as of now, it's not implemented yet. Contact 
# camilosegura@unicauca.edu.co for more info.
#

"""A Questions Bank XBlock"""

import pkg_resources

from xblock.core import XBlock
from xblock.fields import Boolean, JSONField, Scope
from xblock.fragment import Fragment

import copy
import random

@XBlock.needs("user")
class QuestionsBankXBlock(XBlock):
    """
    A Questions Bank XBlock that allows instructors to create a set of questions (only single
    and multiple option supported) and their answers to be shown at students. Displayed 
    questions are randomized and disposed in number as desired by the instructor. XBlock 
    behaves a grading problem.
    """
    # TODO: some of the functionalities above are not yet supported. Check through time
    # or contact camilosegura@unicauca.edu.co

    # Fields (see Fields API or fields.py at edx-platform)
    questions = JSONField(
        default={}, scope=Scope.user_state_summary,
        help="Questions created by the bank. Representation can be found at JS documentation.",
    )
    studentHasCompleted = Boolean(
        default=False, scope=Scope.user_state,
        help="A flag for user input validation. A user can only submit once.",
    )
    studentQuestionary = JSONField(
        default={}, scope=Scope.user_state,
        help="Student questionary containing both questions and answers.",
    )
    studentAnsweredQuestions = JSONField(
        default={}, scope=Scope.user_state_summary,
        help="Solved questionary with details about the student.",
    )

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    #@XBlock.service_declaration("user") # not working
    def student_view(self, context=None):
        """
        The primary view of the QuestionsBankXBlock, shown to students
        when viewing courses.
        """          
        # TODO: Loads student_questions_bank HTML
        html = self.resource_string("static/html/student_questions_bank.html")
        frag = Fragment(html.format(self=self))

        print(self.questions)
        
        frag.add_css(self.resource_string("static/css/questions_bank.css"))
        
        frag.add_javascript(self.resource_string("static/js/src/jquery-2.1.4.min.js"))
        frag.add_javascript(self.resource_string("static/js/src/jquery-ui.min.js"))
        frag.add_javascript(self.resource_string("static/js/src/student_questions_bank.js"))
        
        frag.initialize_js('StudentQuestionsBankXBlock')
        return frag
    
    #TODO: provide instructors information and bank keys(?)
    def studio_view(self, context=None):
        """
        The primary view of the QuestionsBankXBlock, shown to students
        when viewing courses.
        """
        # Notice the Studio prefix at HTML and JS file, also JS initializer
        html = self.resource_string("static/html/studio_questions_bank.html")
        frag = Fragment(html.format(self=self))

        frag.add_css(self.resource_string("static/css/questions_bank.css"))
        
        frag.add_javascript(self.resource_string("static/js/src/jquery-2.1.4.min.js"))
        frag.add_javascript(self.resource_string("static/js/src/jquery-ui.min.js"))
        frag.add_javascript(self.resource_string("static/js/src/studio_questions_bank.js"))
        
        frag.initialize_js('StudioQuestionsBankXBlock')
        return frag
    
    @XBlock.json_handler
    def create_bank(self, data, suffix=''):
        """
        Handler to gather created bank data. Receives a JSON which stores 
        globally
        """
        # Saves to global user_state_summary
        self.questions = data

        print(self.questions)
        print("success")

        return { 'msg': "success" }

    @XBlock.json_handler
    def load_bank(self, data, suffix=''):
        """
        Handler to load an already created bank data. Returns global 'questions'.
        """
        form_id = data # TODO: not used yet, see JS
        print(form_id)

        # Returns only questions (bank) content
        return self.questions[1]['value'] if self.questions else {} # Handle {} in JS

    @XBlock.json_handler
    def load_questionary(self, data, suffix=''):
        """
        Provides a handler to load a randomly generated questionary. Questions and 
        answers are saved to user_questions (user_state) but ONLY questions are sent
        to the Javascript file. If hasCompleted is true, a message is shown.
        """
        # TODO: show a view with completed questions (requires use case where a long time 
        # or instructor approval is needed to release answers)

        # TODO: Create hasCompleted

        # To return ONLY questions not sel (answer) attribute. And ONLY questions (bank) content
        
        only_questions = {}

        if not self.studentHasCompleted:
            num_questions = int(self.questions[2]['value'])  
    
            if self.questions:
                if self.studentQuestionary:
                    only_questions = self.studentQuestionary

                else:
                    only_questions = random.sample(copy.deepcopy(self.questions[1]['value']), num_questions)
                    for question in only_questions:
                        # Obtain choices (questions also contain type, req and label)
                        for option in question['choices']:
                            # And then delete 'sel' attribute
                            del option['sel']
                    
                    self.studentQuestionary = copy.deepcopy(only_questions)
                                
        print(only_questions)

        return only_questions # Handle {} in JS

    @XBlock.json_handler
    def complete_questions(self, data, suffix=''):
        """
        Handler to load an already created bank data. Returns global 'questions'.
        """
        
        print(data)
        # TODO: grading score and return

        self.studentAnsweredQuestions = data #TODO: +qst+rans+u_name+uid+score
        self.studentHasCompleted = True

        # Returns only questions (bank) content
        return { 'score': "100" }

    # Scenarios for the workbench. Ignore.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("QuestionsBankXBlock",
             """<questions_bank/>
             """)
        ]
