import os

views_path = "../../backend/academics/views.py"
with open(views_path, "r", encoding="utf-8") as f:
    content = f.read()

import_ai = "from ai.ai_service import get_ai_service\n"
if "from ai.ai_service" not in content:
    content = import_ai + content

generate_plan_code = '''
    @action(detail=False, methods=['post'])
    def generate_plan(self, request):
        prompt_instruction = request.data.get('instruction', 'Generate a study plan')
        
        # Pull subjects
        subjects = Subject.objects.filter(user=request.user)
        subj_details = [f"{s.name} ({s.topics.count()} topics)" for s in subjects]
        subject_info = ", ".join(subj_details) if subj_details else "General subjects"

        prompt = f"""You are an expert AI teacher. Create a detailed study plan for the student.
Student Request: {prompt_instruction}
Student's Current Subjects: {subject_info}

Format your response in Markdown with clear headings and bullet points. Give actionable daily or weekly tasks."""

        ai_service = get_ai_service()
        success, response_text, error, source = ai_service.generate(prompt=prompt, feature_type='study_plan_provider')

        if not success:
            return Response({'error': error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        plan = StudyPlan.objects.create(
            user=request.user,
            title=request.data.get('title', 'AI Generated Study Plan'),
            ai_prompt_used=prompt_instruction,
            plan_content=response_text
        )

        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
'''

if "def generate_plan(" not in content:
    content += generate_plan_code

with open(views_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated academics/views.py with AI logic.")
