import weaviate
import json

docs = """
Cognitive behavioral therapy (CBT) is a psycho-social intervention that aims to reduce symptoms of various mental health conditions, primarily depression and anxiety disorders. CBT focuses on challenging and changing cognitive distortions (such as thoughts, beliefs, and attitudes) and their associated behaviors to improve emotional regulation and develop personal coping strategies that target solving current problems. Though it was originally designed to treat depression, its uses have been expanded to include the treatment of many mental health conditions, including anxiety, substance use disorders, marital problems, and eating disorders. CBT includes a number of cognitive or behavioral psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies.

CBT is a common form of talk therapy based on the combination of the basic principles from behavioral and cognitive psychology. It is different from historical approaches to psychotherapy, such as the psychoanalytic approach where the therapist looks for the unconscious meaning behind the behaviors, and then formulates a diagnosis. Instead, CBT is a "problem-focused" and "action-oriented" form of therapy, meaning it is used to treat specific problems related to a diagnosed mental disorder. The therapist's role is to assist the client in finding and practicing effective strategies to address the identified goals and to alleviate symptoms of the disorder. CBT is based on the belief that thought distortions and maladaptive behaviors play a role in the development and maintenance of many psychological disorders and that symptoms and associated distress can be reduced by teaching new information-processing skills and coping mechanisms.

When compared to psychoactive medications, review studies have found CBT alone to be as effective for treating less severe forms of depression, anxiety, post-traumatic stress disorder (PTSD), tics, substance use disorders, eating disorders, and borderline personality disorder. Some research suggests that CBT is most effective when combined with medication for treating mental disorders, such as major depressive disorder. CBT is recommended as the first line of treatment for the majority of psychological disorders in children and adolescents, including aggression and conduct disorder. Researchers have found that other bona fide therapeutic interventions were equally effective for treating certain conditions in adults. Along with interpersonal psychotherapy (IPT), CBT is recommended in treatment guidelines as a psychosocial treatment of choice.

Medical uses
In adults, CBT has been shown to be an effective part of treatment plans for anxiety disorders, body dysmorphic disorder, depression, eating disorders, chronic low back pain, personality disorders, psychosis, schizophrenia, substance use disorders, and bipolar disorder. It is also effective as part of treatment plans in the adjustment, depression, and anxiety associated with fibromyalgia, and with post-spinal cord injuries.

In children or adolescents, CBT is an effective part of treatment plans for anxiety disorders, body dysmorphic disorder, depression and suicidality, eating disorders and obesity, obsessive–compulsive disorder (OCD), and posttraumatic stress disorder (PTSD), as well as tic disorders, trichotillomania, and other repetitive behavior disorders. CBT has also been applied to a variety of childhood disorders, including depressive disorders and various anxiety disorders. CBT has shown to be the most effective intervention for people exposed to adverse childhood experiences in the form of abuse or neglect.

Criticism of CBT sometimes focuses on implementations (such as the UK IAPT) which may result initially in low quality therapy being offered by poorly trained practitioners. However, evidence supports the effectiveness of CBT for anxiety and depression.

Evidence suggests that the addition of hypnotherapy as an adjunct to CBT improves treatment efficacy for a variety of clinical issues.

The United Kingdom's National Institute for Health and Care Excellence (NICE) recommends CBT in the treatment plans for a number of mental health difficulties, including PTSD, OCD, bulimia nervosa, and clinical depression.

Patient age
CBT is used to help people of all ages, but the therapy should be adjusted based on the age of the patient with whom the therapist is dealing. Older individuals in particular have certain characteristics that need to be acknowledged and the therapy altered to account for these differences thanks to age. Of the small number of studies examining CBT for the management of depression in older people, there is currently no strong support.

Depression and anxiety disorders
Further information: Major depressive disorder § Talking therapies, Management of depression § Psychotherapy, and Anxiety disorder § Treatment
Cognitive behavioral therapy has been shown as an effective treatment for clinical depression. The American Psychiatric Association Practice Guidelines (April 2000) indicated that, among psychotherapeutic approaches, cognitive behavioral therapy and interpersonal psychotherapy had the best-documented efficacy for treatment of major depressive disorder.[page needed]

A 2001 meta-analysis comparing CBT and psychodynamic psychotherapy suggested the approaches were equally effective in the short term for depression. In contrast, a 2013 meta-analyses suggested that CBT, interpersonal therapy, and problem-solving therapy outperformed psychodynamic psychotherapy and behavioral activation in the treatment of depression.

According to a 2004 review by INSERM of three methods, cognitive behavioral therapy was either proven or presumed to be an effective therapy on several mental disorders. This included depression, panic disorder, post-traumatic stress, and other anxiety disorders.

CBT has been shown to be effective in the treatment of adults with anxiety disorders.

Results from a 2018 systematic review found a high strength of evidence that CBT-exposure therapy can reduce PTSD symptoms and lead to the loss of a PTSD diagnosis. CBT has also been shown to be effective for posttraumatic stress disorder in very young children (3 to 6 years of age). A Cochrane review found low quality evidence that CBT may be more effective than other psychotherapies in reducing symptoms of posttraumatic stress disorder in children and adolescents.

A systematic review of CBT in depression and anxiety disorders concluded that "CBT delivered in primary care, especially including computer- or Internet-based self-help programs, is potentially more effective than usual care and could be delivered effectively by primary care therapists."

Some meta-analyses find CBT more effective than psychodynamic therapy and equal to other therapies in treating anxiety and depression.

Theoretical approaches
One etiological theory of depression is Aaron T. Beck's cognitive theory of depression. His theory states that depressed people think the way they do because their thinking is biased towards negative interpretations. According to this theory, depressed people acquire a negative schema of the world in childhood and adolescence as an effect of stressful life events, and the negative schema is activated later in life when the person encounters similar situations.

Beck also described a negative cognitive triad. The cognitive triad is made up of the depressed individual's negative evaluations of themselves, the world, and the future. Beck suggested that these negative evaluations derive from the negative schemata and cognitive biases of the person. According to this theory, depressed people have views such as "I never do a good job", "It is impossible to have a good day", and "things will never get better". A negative schema helps give rise to the cognitive bias, and the cognitive bias helps fuel the negative schema. Beck further proposed that depressed people often have the following cognitive biases: arbitrary inference, selective abstraction, overgeneralization, magnification, and minimization. These cognitive biases are quick to make negative, generalized, and personal inferences of the self, thus fueling the negative schema.

A basic concept in some CBT treatments used in anxiety disorders is in vivo exposure. CBT-exposure therapy refers to the direct confrontation of feared objects, activities, or situations by a patient. For example, a woman with PTSD who fears the location where she was assaulted may be assisted by her therapist in going to that location and directly confronting those fears. Likewise, a person with a social anxiety disorder who fears public speaking may be instructed to directly confront those fears by giving a speech. This "two-factor" model is often credited to O. Hobart Mowrer. Through exposure to the stimulus, this harmful conditioning can be "unlearned" (referred to as extinction and habituation).

Specialised forms of CBT
CBT-SP, an adaptation of CBT for suicide prevention (SP), was specifically designed for treating youths who are severely depressed and who have recently attempted suicide within the past 90 days, and was found to be effective, feasible, and acceptable.

Acceptance and commitment therapy (ACT) is a specialist branch of CBT (sometimes referred to as contextual CBT). ACT uses mindfulness and acceptance interventions and has been found to have a greater longevity in therapeutic outcomes. In a study with anxiety, CBT and ACT improved similarly across all outcomes from pre- to post-treatment. However, during a 12-month follow-up, ACT proved to be more effective, showing that it is a highly viable lasting treatment model for anxiety disorders.

Computerized CBT (CCBT) has been proven to be effective by randomized controlled and other trials in treating depression and anxiety disorders, including children. Some research has found similar effectiveness to an intervention of informational websites and weekly telephone calls. CCBT was found to be equally effective as face-to-face CBT in adolescent anxiety.

Combined with other treatments
Studies have provided evidence that when examining animals and humans, that glucocorticoids may lead to a more successful extinction learning during exposure therapy for anxiety disorders. For instance, glucocorticoids can prevent aversive learning episodes from being retrieved and heighten reinforcement of memory traces creating a non-fearful reaction in feared situations. A combination of glucocorticoids and exposure therapy may be a better-improved treatment for treating people with anxiety disorders.

Prevention
For anxiety disorders, use of CBT with people at risk has significantly reduced the number of episodes of generalized anxiety disorder and other anxiety symptoms, and also given significant improvements in explanatory style, hopelessness, and dysfunctional attitudes. In another study, 3% of the group receiving the CBT intervention developed generalized anxiety disorder by 12 months postintervention compared with 14% in the control group. Individuals with subthreshold levels of panic disorder significantly benefitted from use of CBT. Use of CBT was found to significantly reduce social anxiety prevalence.

For depressive disorders, a stepped-care intervention (watchful waiting, CBT and medication if appropriate) achieved a 50% lower incidence rate in a patient group aged 75 or older. Another depression study found a neutral effect compared to personal, social, and health education, and usual school provision, and included a comment on potential for increased depression scores from people who have received CBT due to greater self recognition and acknowledgement of existing symptoms of depression and negative thinking styles. A further study also saw a neutral result. A meta-study of the Coping with Depression course, a cognitive behavioral intervention delivered by a psychoeducational method, saw a 38% reduction in risk of major depression.

Bipolar disorder
Many studies show CBT, combined with pharmacotherapy, is effective in improving depressive symptoms, mania severity and psychosocial functioning with mild to moderate effects, and that it is better than medication alone.

INSERM's 2004 review found that CBT is an effective therapy for several mental disorders, including bipolar disorder. This included schizophrenia, depression, bipolar disorder, panic disorder, post-traumatic stress, anxiety disorders, bulimia, anorexia, personality disorders and alcohol
"""

docs = docs.split('\n\n')
