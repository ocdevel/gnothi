from summarize.main import main

#pytest -rP

doc = {
    'name': "CBT 1",
    'content': 'CCognitive behavioral therapy (CBT) is a psycho-social intervention that aims to reduce symptoms of various mental health conditions, primarily depression and anxiety disorders. CBT focuses on challenging and changing cognitive distortions (such as thoughts, beliefs, and attitudes) and their associated behaviors to improve emotional regulation and develop personal coping strategies that target solving current problems. Though it was originally designed to treat depression, its uses have been expanded to include the treatment of many mental health conditions, including anxiety, substance use disorders, marital problems, and eating disorders. CBT includes a number of cognitive or behavioral psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies. Cognitive behavioral therapy (CBT) is a psycho-social intervention that aims to reduce symptoms of various mental health conditions, primarily depression and anxiety disorders. CBT focuses on challenging and changing cognitive distortions (such as thoughts, beliefs, and attitudes) and their associated behaviors to improve emotional regulation and develop personal coping strategies that target solving current problems. Though it was originally designed to treat depression, its uses have been expanded to include the treatment of many mental health conditions, including anxiety, substance use disorders, marital problems, and eating disorders. CBT includes a number of cognitive or behavioral psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies. Cognitive behavioral therapy (CBT) is a psycho-social intervention that aims to reduce symptoms of various mental health conditions, primarily depression and anxiety disorders. CBT focuses on challenging and changing cognitive distortions (such as thoughts, beliefs, and attitudes) and their associated behaviors to improve emotional regulation and develop personal coping strategies that target solving current problems. Though it was originally designed to treat depression, its uses have been expanded to include the treatment of many mental health conditions, including anxiety, substance use disorders, marital problems, and eating disorders. CBT includes a number of cognitive or behavioral psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies. Cognitive behavioral therapy (CBT) is a psycho-social intervention that aims to reduce symptoms of various mental health conditions, primarily depression and anxiety disorders. CBT focuses on challenging and changing cognitive distortions (such as thoughts, beliefs, and attitudes) and their associated behaviors to improve emotional regulation and develop personal coping strategies that target solving current problems. Though it was originally designed to treat depression, its uses have been expanded to include the treatment of many mental health conditions, including anxiety, substance use disorders, marital problems, and eating disorders. CBT includes a number of cognitive or behavioral psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies. Cognitive behavioral therapy (CBT) is a psycho-social intervention that aims to reduce symptoms of various mental health conditions, primarily depression and anxiety disorders. CBT focuses on challenging and changing cognitive distortions (such as thoughts, beliefs, and attitudes) and their associated behaviors to improve emotional regulation and develop personal coping strategies that target solving current problems. Though it was originally designed to treat depression, its uses have been expanded to include the treatment of many mental health conditions, including anxiety, substance use disorders, marital problems, and eating disorders. CBT includes a number of cognitive or behavioral psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies. Cognitive behavioral therapy (CBT) is a psycho-social intervention that aims to reduce symptoms of various mental health conditions, primarily depression and anxiety disorders. CBT focuses on challenging and changing cognitive distortions (such as thoughts, beliefs, and attitudes) and their associated behaviors to improve emotional regulation and develop personal coping strategies that target solving current problems. Though it was originally designed to treat depression, its uses have been expanded to include the treatment of many mental health conditions, including anxiety, substance use disorders, marital problems, and eating disorders. CBT includes a number of cognitive or behavioral psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies. Cognitive behavioral therapy (CBT) is a psycho-social intervention that aims to reduce symptoms of various mental health conditions, primarily depression and anxiety disorders. CBT focuses on challenging and changing cognitive distortions (such as thoughts, beliefs, and attitudes) and their associated behaviors to improve emotional regulation and develop personal coping strategies that target solving current problems. Though it was originally designed to treat depression, its uses have been expanded to include the treatment of many mental health conditions, including anxiety, substance use disorders, marital problems, and eating disorders. CBT includes a number of cognitive or behavioral psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies. Cognitive behavioral therapy (CBT) is a psycho-social intervention that aims to reduce symptoms of various mental health conditions, primarily depression and anxiety disorders. CBT focuses on challenging and changing cognitive distortions (such as thoughts, beliefs, and attitudes) and their associated behaviors to improve emotional regulation and develop personal coping strategies that target solving current problems. Though it was originally designed to treat depression, its uses have been expanded to include the treatment of many mental health conditions, including anxiety, substance use disorders, marital problems, and eating disorders. CBT includes a number of cognitive or behavioral psychotherapies that treat defined psychopathologies using evidence-based techniques and strategies.',
}
event = [
    {
        'text': doc['content'],
        'params': {
            'keywords': {'top_n ': 5},
            'summarize': {'min_length': 50, 'max_length': 100},
            'emotion': True
        }
    }
]
res = main(event, {})
print(res)
