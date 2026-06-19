# 09_DATABASE_ARCHITECTURE.md

# English Galaxy Academy

## Database Architecture

The platform must be designed using a curriculum-driven content architecture.

Educational content, curriculum data, resources, users, and AI-generated materials must be interconnected through structured relationships.

The database architecture must support:

* Curriculum management
* Educational content management
* Search indexing
* AI content generation
* User management
* Analytics
* Future LMS features

---

# Core Database Philosophy

Everything should be connected to curriculum structures.

Hierarchy:

Curriculum

↓

Grade

↓

Unit

↓

Learning Outcomes

↓

Educational Resources

↓

Users

↓

Analytics

---

# Primary Entities

The system must include:

Curriculum

Grades

Units

Learning Outcomes

Lessons

Worksheets

Flashcards

Quizzes

Stories

Audio Resources

Teacher Resources

Blog Articles

Users

Roles

Tags

Media Files

AI Generated Content

Analytics

---

# Curriculum Entity

Purpose:

Store curriculum versions.

Fields:

id

title

description

curriculum_source

version

country

language

academic_year

status

created_at

updated_at

---

# Grade Entity

Fields:

id

curriculum_id

grade_name

grade_number

education_level

display_order

status

created_at

updated_at

---

# Unit Entity

Fields:

id

grade_id

unit_code

unit_name

unit_description

display_order

estimated_duration

status

created_at

updated_at

---

# Learning Outcome Entity

Fields:

id

unit_id

outcome_code

outcome_description

skill_type

difficulty

status

created_at

updated_at

---

# Lesson Entity

Fields:

id

title

slug

description

grade_id

unit_id

difficulty

content

reading_time

featured_image

publication_status

created_by

created_at

updated_at

---

# Worksheet Entity

Fields:

id

title

slug

grade_id

unit_id

pdf_url

answer_key_url

difficulty

status

created_at

updated_at

---

# Flashcard Entity

Fields:

id

word

pronunciation

definition

example_sentence

image_url

difficulty

unit_id

grade_id

created_at

updated_at

---

# Quiz Entity

Fields:

id

title

grade_id

unit_id

difficulty

estimated_duration

question_count

status

created_at

updated_at

---

# Quiz Question Entity

Fields:

id

quiz_id

question_type

question_text

correct_answer

difficulty

display_order

created_at

updated_at

---

# Story Entity

Fields:

id

title

slug

grade_id

unit_id

difficulty

story_text

vocabulary_list

comprehension_questions

status

created_at

updated_at

---

# Audio Resource Entity

Fields:

id

title

transcript

audio_url

duration

grade_id

unit_id

status

created_at

updated_at

---

# Teacher Resource Entity

Fields:

id

title

resource_type

grade_id

unit_id

resource_url

description

status

created_at

updated_at

---

# Blog Entity

Fields:

id

title

slug

content

author

category

featured_image

publication_status

created_at

updated_at

---

# Tag Entity

Fields:

id

name

slug

description

created_at

updated_at

---

# Media Library Entity

Fields:

id

file_name

file_type

file_size

file_path

thumbnail

uploaded_by

created_at

updated_at

---

# User Entity

Fields:

id

first_name

last_name

email

role_id

profile_image

status

created_at

updated_at

---

# Role Entity

Fields:

id

role_name

description

permissions

created_at

updated_at

---

# AI Content Entity

Fields:

id

prompt

content_type

generated_content

grade_id

unit_id

generation_model

review_status

approved_by

created_at

updated_at

---

# Analytics Entity

Fields:

id

user_id

resource_id

resource_type

action_type

timestamp

metadata

---

# Relationship Structure

Curriculum

has many

Grades

---

Grade

has many

Units

---

Unit

has many

Learning Outcomes

---

Unit

has many

Lessons

Worksheets

Flashcards

Quizzes

Stories

Audio Resources

Teacher Resources

---

User

has many

Generated Resources

Downloads

Activities

---

# Search Index System

Indexed Content:

Lessons

Worksheets

Flashcards

Stories

Quizzes

Teacher Resources

Blog Articles

Curriculum Data

Tags

---

# Curriculum Versioning

The system must support:

Multiple Curriculum Versions

Archived Curriculum

Future Curriculum Updates

Curriculum Comparison

Migration Tracking

---

# Content Versioning

Every content item should support:

Draft Version

Review Version

Published Version

Archived Version

Revision History

---

# AI Integration Layer

The database must support:

AI Requests

AI Outputs

Review Workflow

Approval Workflow

Generation History

---

# Scalability Targets

Support:

100,000+ Content Items

10,000+ Resources

1,000+ Curriculum Records

100,000+ Users

Millions of Search Queries

---

# Backup Strategy

Daily Backups

Incremental Backups

Media Backups

Curriculum Backups

Recovery System

---

# Security Requirements

Encrypted Authentication

Role-Based Access Control

Audit Logs

Activity Tracking

Data Validation

Backup Monitoring

---

# Database Philosophy

The database must prioritize:

1. Curriculum-first architecture
2. Content relationships
3. Scalability
4. Searchability
5. AI readiness
6. Security
7. Maintainability
8. Future expansion
