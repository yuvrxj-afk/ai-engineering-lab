# 3. Structured Output

Get the model to return validated JSON every time. Map a query to a `{ title, summary, tags[] }` shape, validate with Zod or Pydantic, and implement a retry that feeds the validation error back to the model.

## Handling Failure

Decide what happens when retry also fails: surface the error or accept partial output. Either is valid — pick one and be explicit. Silent schema failures are how bad data reaches your database.

!!! note "Start your eval set"
    Start keeping a list of 5–10 inputs and whether each produces the right output. That list is the beginning of an eval set. Every module from here builds on this habit.

## Resources

[OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs) · [Claude structured output](https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/increase-consistency) · [Instructor](https://python.useinstructor.com/)
