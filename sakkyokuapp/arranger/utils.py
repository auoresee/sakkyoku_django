# returns index of the first element that func returns true for
def indexWhere(func, array):
    for i in range(len(array)):
        if func(array[i]):
            return i
    return -1