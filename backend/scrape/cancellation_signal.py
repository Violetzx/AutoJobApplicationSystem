


class CancellationSignal:
    def __init__(self):
        self.cancelled = False

    def set_cancelled(self):
        self.cancelled = True

    def is_cancelled(self):
        return self.cancelled
    
    def reset(self):
        self.cancelled = False

