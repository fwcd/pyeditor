import json
import sys
from bdb import Bdb

def writejson(obj):
    print(json.dumps(obj))

def readjson():
    return json.loads(input())

def expect(dict_obj, key, value):
    try:
        assert dict_obj[key] == value
    except:
        raise ValueError(str(dict_obj) + "[" + str(key) + "] was not " + str(value))

class JsonDebugger(Bdb):
    def runfile(self, filename):
        self.mainfilepath = self.canonic(filename)
        self.run("exec(open(%r).read())" % self.mainfilepath)
    
    # Override Bdb methods
    
    def user_call(self, frame, argument_list):
        """This method is called when there is the remote possibility
        that we ever need to stop in this function."""
        pass

    def user_line(self, frame):
        """This method is called when we stop or break at this line."""
        is_main_file = (self.canonic(frame.f_code.co_filename) == "<string>")
        if is_main_file:
            line = frame.f_lineno
            writejson({
                "type": "break",
                "linenumber": line
            })
            msg = readjson()
            expect(msg, "type", "continue")

    def user_return(self, frame, return_value):
        """This method is called when a return trap is set here."""
        pass

    def user_exception(self, frame, exc_info):
        exc_type, exc_value, exc_traceback = exc_info
        """This method is called if an exception occurs,
        but only if we are to stop at or just below this level."""
        pass

# TODO: Use sockets and parse filename from program args

filename = "playground.py"
JsonDebugger().runfile(filename)
