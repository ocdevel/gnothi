import pdb, pytest
from app.nlp import NLP

nlp_ = NLP()

paras = [
    "Virtual reality (VR) is a simulated experience that can be similar to or completely different from the real world. Applications of virtual reality can include entertainment (i.e. video games) and educational purposes (i.e. medical or military training). Other, distinct types of VR style technology include augmented reality and mixed reality, sometimes referred to as extended reality or XR.",
    "Currently standard virtual reality systems use either virtual reality headsets or multi-projected environments to generate realistic images, sounds and other sensations that simulate a user's physical presence in a virtual environment. A person using virtual reality equipment is able to look around the artificial world, move around in it, and interact with virtual features or items. The effect is commonly created by VR headsets consisting of a head-mounted display with a small screen in front of the eyes, but can also be created through specially designed rooms with multiple large screens. Virtual reality typically incorporates auditory and video feedback, but may also allow other types of sensory and force feedback through haptic technology.",
    "The exact origins of virtual reality are disputed, partly because of how difficult it has been to formulate a definition for the concept of an alternative existence.[5] The development of perspective in Renaissance Europe created convincing depictions of spaces that did not exist, in what has been referred to as the \"multiplying of artificial worlds\".[6] Other elements of virtual reality appeared as early as the 1860s. Antonin Artaud took the view that illusion was not distinct from reality, advocating that spectators at a play should suspend disbelief and regard the drama on stage as reality.[3] The first references to the more modern concept of virtual reality came from science fiction.",

    "Cognitive behavioral therapy (CBT) is a psycho-social intervention[1][2] that aims to improve mental health.[3] CBT focuses on challenging and changing unhelpful cognitive distortions (e.g. thoughts, beliefs, and attitudes) and behaviors, improving emotional regulation,[2][4] and the development of personal coping strategies that target solving current problems. Originally, it was designed to treat depression, but its uses have been expanded to include treatment of a number of mental health conditions, including anxiety.[5][6] CBT includes a number of cognitive or behavior psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies.[7][8][9]",
    "CBT is based on the combination of the basic principles from behavioral and cognitive psychology.[2] It is different from historical approaches to psychotherapy, such as the psychoanalytic approach where the therapist looks for the unconscious meaning behind the behaviors and then formulates a diagnosis. Instead, CBT is a \"problem-focused\" and \"action-oriented\" form of therapy, meaning it is used to treat specific problems related to a diagnosed mental disorder. The therapist's role is to assist the client in finding and practicing effective strategies to address the identified goals and decrease symptoms of the disorder.[10] CBT is based on the belief that thought distortions and maladaptive behaviors play a role in the development and maintenance of psychological disorders,[3] and that symptoms and associated distress can be reduced by teaching new information-processing skills and coping mechanisms.[1][10][11]",
    "When compared to psychoactive medications, review studies have found CBT alone to be as effective for treating less severe forms of depression,[12] anxiety, post traumatic stress disorder (PTSD), tics,[13] substance abuse, eating disorders and borderline personality disorder.[14] Some research suggests that CBT is most effective when combined with medication for treating mental disorders such as Major Depressive Disorder.[15] In addition, CBT is recommended as the first line of treatment for the majority of psychological disorders in children and adolescents, including aggression and conduct disorder.[1][4] Researchers have found that other bona fide therapeutic interventions were equally effective for treating certain conditions in adults.[16][17] Along with interpersonal psychotherapy (IPT), CBT is recommended in treatment guidelines as a psychosocial treatment of choice,[1][18] and CBT and IPT are the only psychosocial interventions that psychiatry residents in the United States are mandated to be trained in.[1]",
    "Precursors of certain fundamental aspects of CBT have been identified in various ancient philosophical traditions, particularly Stoicism.[19] Stoic philosophers, particularly Epictetus, believed logic could be used to identify and discard false beliefs that lead to destructive emotions, which has influenced the way modern cognitive-behavioral therapists identify cognitive distortions that contribute to depression and anxiety.[20] For example, Aaron T. Beck's original treatment manual for depression states, \"The philosophical origins of cognitive therapy can be traced back to the Stoic philosophers\".[21] Another example of Stoic influence on cognitive theorists is Epictetus on Albert Ellis.[22] A key philosophical figure who also influenced the development of CBT was John Stuart Mill.[23]"
]


class TestNoGroup():
    def test_empty(self):
        res = nlp_.summarization([])
        assert len(res) == 1
        res = res[0]
        assert res['summary'] is None
        assert not res['sentiment']

    def test_basic(self):
        res = nlp_.summarization(paras)
        assert len(res) == 1
        res = res[0]
        assert 'VR' in res['summary'] or "Virtual" in res['summary']
        assert len(res['sentiment'])

    def test_nosent(self):
        res = nlp_.summarization(paras, with_sentiment=False)
        assert len(res) == 1
        res = res[0]
        assert not res['sentiment']

    def test_min_max(self):
        res = nlp_.summarization(paras, min_length=5, max_length=20)
        assert len(res) == 1
        res = res[0]
        assert 'VR' in res['summary'] or "Virtual" in res['summary']
        assert len(res['sentiment'])

groups = [paras[:3], paras[3:]]


class TestGroup():
    @pytest.mark.skip()
    def test_empty(self):
        # how to handle multi-empty (entry job)?
        res = nlp_.summarization([[]])
        assert len(res) == 1
        res = res[0]
        assert res['summary'] is None
        assert not res['sentiment']

    def test_basic(self):
        res = nlp_.summarization(groups)
        assert len(res) == 2
        res = res[0]
        assert 'VR' in res['summary'] or "Virtual" in res['summary']
        assert len(res['sentiment'])

    def test_nosent(self):
        res = nlp_.summarization(groups, with_sentiment=False)
        assert len(res) == 2
        res = res[0]
        assert not res['sentiment']

    def test_min_max(self):
        res = nlp_.summarization(groups, min_length=5, max_length=20)
        assert len(res) == 2
        res = res[0]
        assert 'VR' in res['summary'] or "Virtual" in res['summary']
        assert len(res['sentiment'])
