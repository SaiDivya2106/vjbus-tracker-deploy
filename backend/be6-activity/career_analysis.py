import json
import os
from typing import List, Dict, Any
import logging
import google.generativeai as genai
import re

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CareerAnalyzer:
    def __init__(self, gemini_model_version="gemini-2.0-flash"):
        self.career_goals = self._load_career_goals()
        self.gemini_model_version = gemini_model_version  # Add model version variable
        
    def _load_career_goals(self) -> Dict[str, Any]:
        """Load career goals from JSON file"""
        try:
            with open('career_goals.json', 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading career goals: {str(e)}")
            return {}
            
    def _configure_gemini(self, user_api_key=None):
        """Configure the Gemini API with the appropriate key"""
        key_source = "System"
        
        try:
            if user_api_key:
                try:
                    from app import decrypt_api_key
                    decrypted_key = decrypt_api_key(user_api_key)
                    logger.debug("Successfully decrypted user API key")
                    genai.configure(api_key=decrypted_key)
                    key_source = "User-provided"
                except Exception as decrypt_error:
                    logger.error(f"Decryption failed: {str(decrypt_error)}")
                    if os.getenv('GEMINI_API_KEY'):
                        logger.warning("Falling back to system API key")
                        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
                        key_source = "System (fallback)"
                    else:
                        raise Exception("Invalid user API key and no system key available")
            else:
                if not os.getenv('GEMINI_API_KEY'):
                    raise Exception("No system API key configured")
                genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
                
            logger.info(f"Using {key_source} API key for generation")
            # Use the model version variable here
            return genai.GenerativeModel(self.gemini_model_version), True
            
        except Exception as e:
            logger.error(f"Failed to configure Gemini: {str(e)}")
            return None, False
            
    def find_similar_activities(self, activity: Dict[str, Any], user_api_key=None) -> List[Dict[str, Any]]:
        """Find similar activities from career goals using Gemini"""
        # Configure Gemini
        model, success = self._configure_gemini(user_api_key)
        if not success:
            logger.warning("Could not configure Gemini API, returning empty list")
            return []
            
        try:
            # Format the activity
            activity_title = activity.get('title', '')
            activity_description = activity.get('description', '')
            activity_skills = ", ".join(activity.get('skills', []))
            
            # Create the prompt
            prompt = f"""
            I have an activity with the following details:
            Title: {activity_title}
            Description: {activity_description}
            Skills: {activity_skills}
            
            Below is a list of career activities. Find the most similar activities to mine.
            
            """
            
            # Add all potential activities from career goals
            for career_path, career_data in self.career_goals.get('career_goals', {}).items():
                prompt += f"\nCareer: {career_data['title']}\n"
                for idx, act in enumerate(career_data['activities'], 1):
                    skills_text = ", ".join(act.get('skills', []))
                    prompt += f"{idx}. {act['title']}: {act['description']} (Skills: {skills_text})\n"
            
            prompt += """
            Return a JSON array of the most similar activities with the following structure:
            [
                {
                    "career_path": "career_key",
                    "activity_title": "Activity Title",
                    "similarity": 0.85
                }
            ]
            
            Only include activities with similarity score above 0.7. Sort by similarity in descending order.
            Only return the JSON array, no other text.
            """
            
            # Generate response
            response = model.generate_content(prompt)
            
            # Extract JSON
            json_match = re.search(r'(\[[\s\S]*\])', response.text)
            if json_match:
                similar_activities = json.loads(json_match.group(1))
                return similar_activities
            else:
                try:
                    # Try parsing the whole text as JSON
                    similar_activities = json.loads(response.text)
                    return similar_activities
                except:
                    logger.error("Could not parse Gemini response as JSON")
                    return []
                    
        except Exception as e:
            logger.error(f"Error finding similar activities: {str(e)}")
            return []
    
    def find_career_match(self, user_activities: List[Dict[str, Any]], user_api_key=None) -> List[Dict[str, Any]]:
        """Find career paths that match the user's activities using Gemini"""
        if not user_activities:
            return []
            
        # Configure Gemini
        model, success = self._configure_gemini(user_api_key)
        if not success:
            logger.warning("Could not configure Gemini API, returning empty list")
            return []
            
        try:
            # Format user activities for the prompt
            user_activities_text = ""
            for i, activity in enumerate(user_activities[:10], 1):  # Limit to 10 for prompt length
                skills_text = ", ".join(activity.get('skills', []))
                user_activities_text += f"{i}. {activity['title']}: {activity.get('description', '')} (Skills: {skills_text})\n"
            
            # Create the prompt
            prompt = f"""
            Based on a user's activities, determine which career paths are the best match.
            
            User's activities:
            {user_activities_text}
            
            Available career paths:
            """
            
            # Add all career paths from career goals
            for career_path, career_data in self.career_goals.get('career_goals', {}).items():
                skills_text = ", ".join(career_data['required_skills'])
                prompt += f"\n{career_data['title']}: {career_data['description']}\nRequired skills: {skills_text}\n"
            
            prompt += """
            Return a JSON array of matching careers with the following structure:
            [
                {
                    "career_path": "career_key",
                    "title": "Career Title",
                    "similarity": 0.85
                }
            ]
            
            Only include career paths with similarity score above 0.5. Sort by similarity in descending order.
            Only return the JSON array, no other text.
            """
            
            # Generate response
            response = model.generate_content(prompt)
            
            # Extract JSON
            json_match = re.search(r'(\[[\s\S]*\])', response.text)
            if json_match:
                matching_careers = json.loads(json_match.group(1))
                return matching_careers
            else:
                try:
                    # Try parsing the whole text as JSON
                    matching_careers = json.loads(response.text)
                    return matching_careers
                except:
                    logger.error("Could not parse Gemini response as JSON")
                    return []
                    
        except Exception as e:
            logger.error(f"Error finding career matches: {str(e)}")
            return []
        
    def analyze_career_gaps(self, user_activities: List[Dict[str, Any]], target_career: str, user_api_key=None) -> Dict[str, Any]:
        """Analyze gaps between user's activities and target career requirements using Gemini"""
        if target_career not in self.career_goals.get('career_goals', {}):
            return {'error': f'Career path {target_career} not found'}
            
        # Configure Gemini
        model, success = self._configure_gemini(user_api_key)
        if not success:
            logger.warning("Could not configure Gemini API, using fallback gap analysis")
            return self._generate_fallback_gap_analysis(user_activities, target_career)
            
        try:
            # Get target career data
            target_data = self.career_goals['career_goals'][target_career]
            
            # Format user activities for the prompt
            user_activities_text = ""
            for i, activity in enumerate(user_activities[:10], 1):  # Limit to 10 for prompt length
                skills_text = ", ".join(activity.get('skills', []))
                user_activities_text += f"{i}. {activity['title']}: {activity.get('description', '')} (Skills: {skills_text})\n"
            
            # Format target activities
            target_activities_text = ""
            for i, activity in enumerate(target_data['activities'], 1):
                skills_text = ", ".join(activity.get('skills', []))
                target_activities_text += f"{i}. {activity['title']}: {activity['description']} (Skills: {skills_text})\n"
            
            # Create the prompt
            prompt = f"""
            Analyze the gap between a user's current activities and the requirements for a {target_data['title']} career path.
            
            Career: {target_data['title']}
            Description: {target_data['description']}
            Required skills: {', '.join(target_data['required_skills'])}
            
            Career activities:
            {target_activities_text}
            
            User's current activities:
            {user_activities_text}
            
            Analyze the gap between the user's activities and the career requirements. Return a JSON object with the following structure:
            {{
                "missing_skills": ["Skill 1", "Skill 2"],
                "missing_activities": [
                    {{
                        "title": "Activity Title",
                        "description": "Activity Description",
                        "skills": ["Skill 1", "Skill 2"]
                    }}
                ],
                "progress": {{
                    "skills": 0.75,
                    "activities": 0.6,
                    "overall": 0.675
                }}
            }}
            
            Only return the JSON object, no other text.
            """
            
            # Generate response
            response = model.generate_content(prompt)
            
            # Extract JSON
            json_match = re.search(r'({[\s\S]*})', response.text)
            if json_match:
                gap_analysis = json.loads(json_match.group(1))
                return gap_analysis
            else:
                try:
                    # Try parsing the whole text as JSON
                    gap_analysis = json.loads(response.text)
                    return gap_analysis
                except:
                    logger.error("Could not parse Gemini response as JSON")
                    return self._generate_fallback_gap_analysis(user_activities, target_career)
                    
        except Exception as e:
            logger.error(f"Error analyzing career gaps: {str(e)}")
            return self._generate_fallback_gap_analysis(user_activities, target_career)
    
    def _generate_fallback_gap_analysis(self, user_activities: List[Dict[str, Any]], target_career: str) -> Dict[str, Any]:
        """Generate a basic gap analysis without Gemini"""
        target_data = self.career_goals['career_goals'][target_career]
        required_skills = set(target_data['required_skills'])
        
        # Get user's skills from activities
        user_skills = set()
        for activity in user_activities:
            if 'skills' in activity:
                user_skills.update(activity['skills'])
                
        # Find missing skills
        missing_skills = required_skills - user_skills
        
        # Calculate progress percentages
        skill_progress = (len(required_skills) - len(missing_skills)) / len(required_skills) if required_skills else 1.0
        activity_progress = len(user_activities) / max(1, len(target_data['activities']))
        
        return {
            'missing_skills': list(missing_skills),
            'missing_activities': target_data['activities'][:2],  # Just include a couple sample activities
            'progress': {
                'skills': skill_progress,
                'activities': activity_progress,
                'overall': (skill_progress + activity_progress) / 2
            }
        }
        
    def generate_roadmap(self, user_activities: List[Dict[str, Any]], target_career: str, user_api_key=None) -> Dict[str, Any]:
        """Generate a personalized roadmap using Gemini"""
        try:
            # Get gap analysis - pass the user API key for this analysis too
            gap_analysis = self.analyze_career_gaps(user_activities, target_career, user_api_key)
            
            # Configure Gemini
            model, success = self._configure_gemini(user_api_key)
            if not success:
                logger.warning("Could not configure Gemini API, returning gap analysis with basic recommendations")
                return {
                    'gap_analysis': gap_analysis,
                    'recommendations': {
                        'next_steps': [f"Learn {skill}" for skill in gap_analysis['missing_skills'][:3]],
                        'project_ideas': [activity['title'] for activity in gap_analysis['missing_activities'][:2]],
                        'learning_resources': [],
                        'timeline': {
                            'short_term': 'Focus on fundamental skills',
                            'medium_term': 'Complete missing activities',
                            'long_term': 'Build portfolio projects'
                        }
                    }
                }
                
            # Prepare context for Gemini
            target_data = self.career_goals['career_goals'][target_career]
            
            # Format user activities for the prompt
            user_activities_text = ""
            for i, activity in enumerate(user_activities[:5], 1):  # Limit to 5 for prompt length
                skills_text = ", ".join(activity.get('skills', []))
                user_activities_text += f"{i}. {activity['title']}: {activity.get('description', '')} (Skills: {skills_text})\n"
            
            # Format missing activities
            missing_activities_text = ""
            for i, activity in enumerate(gap_analysis['missing_activities'][:3], 1):  # Limit to 3
                skills_text = ", ".join(activity.get('skills', []))
                missing_activities_text += f"{i}. {activity['title']}: {activity['description']} (Skills: {skills_text})\n"
            
            # Create prompt for Gemini
            prompt = f"""
            Create a personalized career roadmap for becoming a {target_data['title']}.
            
            About the career:
            {target_data['description']}
            
            Current Progress:
            - Skills mastered: {len(set(target_data['required_skills']) - set(gap_analysis['missing_skills']))} out of {len(target_data['required_skills'])}
            - Missing Skills: {', '.join(gap_analysis['missing_skills'])}
            - Completed Activities: {len(user_activities)}
            - Missing Key Activities: {len(gap_analysis['missing_activities'])}
            
            User's current activities:
            {user_activities_text}
            
            Key missing activities:
            {missing_activities_text}
            
            Based on the user's current activities and the gaps identified, provide a JSON response with:
            1. A prioritized list of next steps
            2. Specific project ideas to develop missing skills
            3. Recommended learning resources (courses, books, websites)
            4. Timeline estimates for each step
            
            Your response should be in JSON format ONLY with the following structure:
            {{
                "next_steps": ["Step 1", "Step 2", "Step 3"],
                "project_ideas": [
                    {{
                        "title": "Project Title",
                        "description": "Brief description",
                        "skills_gained": ["Skill 1", "Skill 2"]
                    }}
                ],
                "learning_resources": [
                    {{
                        "type": "course/book/website",
                        "title": "Resource Title",
                        "link": "URL if applicable",
                        "description": "Brief description"
                    }}
                ],
                "timeline": {{
                    "short_term": "What to focus on in 1-3 months",
                    "medium_term": "What to focus on in 3-6 months",
                    "long_term": "What to focus on in 6-12 months"
                }}
            }}
            
            Make the recommendations specific, actionable, and tailored to the user's current skills and activities.
            """
            
            # Generate recommendation
            response = model.generate_content(prompt)
            # print(f"Gemini response: {response.text}")  # Removed debugging print statement
            
            # Parse JSON from response
            try:
                # Extract JSON part
                response_text = response.text
                json_match = re.search(r'({[\s\S]*})', response_text)
                
                if json_match:
                    recommendations = json.loads(json_match.group(1))
                else:
                    # Try parsing the whole text as JSON
                    recommendations = json.loads(response_text)
                    
                # Combine with gap analysis
                return {
                    'gap_analysis': gap_analysis,
                    'recommendations': recommendations
                }
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing Gemini response: {str(e)}")
                logger.info(f"Response text: {response.text}")  # This is a log, not a print, so it's kept
                
                # Return fallback recommendations
                return {
                    'gap_analysis': gap_analysis,
                    'recommendations': {
                        'next_steps': [f"Learn {skill}" for skill in gap_analysis['missing_skills'][:3]],
                        'project_ideas': [{"title": activity['title'], "description": activity['description']} 
                                        for activity in gap_analysis['missing_activities'][:2]],
                        'learning_resources': [],
                        'timeline': {
                            'short_term': 'Focus on fundamental skills',
                            'medium_term': 'Complete missing activities',
                            'long_term': 'Build portfolio projects'
                        }
                    },
                    'error': 'Error parsing Gemini response'
                }
            
        except Exception as e:
            logger.error(f"Error generating roadmap: {str(e)}")
            return {'error': str(e)}