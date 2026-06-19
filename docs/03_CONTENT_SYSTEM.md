# 03_CONTENT_SYSTEM.md

# English Galaxy Academy

## Content Management System

The platform uses a Markdown-based content architecture.

All educational materials must be created and stored as structured Markdown files.

The system should automatically read metadata, categorize content, generate navigation, and create searchable indexes.

---

# Content Categories

Every educational level must support the following content types:

* Lessons
* Worksheets
* Flashcards
* Quizzes
* Games
* Stories
* Audio Resources
* Teacher Resources
* PDF Resources

---

# Educational Structure

School-based sections follow MEB curriculum.

Primary School

Grades 1–4

Middle School

Grades 5–8

High School

Grades 9–12

Independent Learning

A1
A2
B1
B2
C1

---

# Markdown Folder Structure

/content

/primary

/grade-1
/grade-2
/grade-3
/grade-4

/middle-school

/grade-5
/grade-6
/grade-7
/grade-8

/high-school

/grade-9
/grade-10
/grade-11
/grade-12

/independent-learning

/a1
/a2
/b1
/b2
/c1

/blog

/resources

---

# Content Type Folder Structure

Example:

/primary/grade-4

/lessons
/worksheets
/flashcards
/quizzes
/games
/stories
/audio
/teacher-resources
/pdf

---

# Required Metadata

Every Markdown file must begin with frontmatter.

Example:

---

title:
description:
grade:
unit:
level:
contentType:
tags:
author:
date:
updated:
difficulty:
estimatedReadingTime:
featured:
thumbnail:
pdfAvailable:
audioAvailable:
---------------

---

# Metadata Definitions

title

Content title.

description

SEO-friendly summary.

grade

Grade level.

Examples:

grade-1
grade-7
grade-11

unit

Curriculum unit.

Example:

unit-1
unit-2

level

Educational level.

Values:

primary
middle-school
high-school
independent-learning

contentType

Values:

lesson
worksheet
flashcard
quiz
game
story
audio
teacher-resource
pdf-resource

difficulty

Values:

beginner
elementary
intermediate
advanced

featured

true / false

---

# Lesson Template

Every lesson should follow the same structure.

# Lesson Title

## Learning Objectives

## Vocabulary

## Key Expressions

## Grammar Focus

## Reading Section

## Listening Section

## Speaking Practice

## Writing Activity

## Classroom Activity

## Summary

## Related Resources

---

# Worksheet Template

# Worksheet Title

## Instructions

## Activity 1

## Activity 2

## Activity 3

## Challenge Section

## Answer Key

---

# Flashcard Template

Each flashcard must contain:

Word

Pronunciation

Definition

Example Sentence

Visual Reference

Difficulty Level

Related Unit

---

# Quiz Template

# Quiz Title

## Multiple Choice Questions

## Matching Questions

## Fill in the Blanks

## True / False

## Results Section

---

# Story Template

# Story Title

## Story Text

## Vocabulary List

## Comprehension Questions

## Discussion Questions

## Extension Activity

---

# Teacher Resource Template

# Resource Title

## Target Grade

## Unit

## Objectives

## Required Materials

## Lesson Procedure

## Assessment Suggestions

## Homework Suggestions

---

# PDF Resource Rules

PDF files should be stored separately.

Each PDF resource must have a matching Markdown file.

Example:

worksheet-unit-3.pdf

worksheet-unit-3.md

The Markdown file acts as metadata and preview content.

---

# Audio Resource Rules

Audio files must have:

Title

Transcript

Duration

Target Level

Associated Unit

Download Option

---

# Tagging System

Each content item should contain tags.

Examples:

grammar

vocabulary

reading

writing

speaking

listening

worksheet

flashcards

assessment

classroom-game

teacher-resource

---

# Related Content Engine

The system should automatically suggest:

Same Grade

Same Unit

Same Tags

Same Skill Area

Related Content Types

---

# Content Review Workflow

Draft

Review

Approved

Published

Archived

---

# SEO Requirements

Every content item must include:

SEO title

SEO description

Keyword tags

Open Graph image

Canonical URL

Structured metadata

---

# Accessibility Requirements

All content should:

Use clear headings

Provide image alt text

Provide audio transcripts

Support screen readers

Be mobile friendly

---

# Content Scalability Rules

The content architecture must support:

100,000+ content items

Future AI-generated content

Multilingual expansion

Additional educational subjects

Future LMS integration

Without changing content structure.

---

# Content Philosophy

Content should be:

Educational

Curriculum-aligned

Teacher-friendly

Student-friendly

Searchable

Reusable

Printable

Scalable
