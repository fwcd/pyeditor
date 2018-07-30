import json
import sys
from argparse import ArgumentParser
from bdb import Bdb
from socket import socket, AF_INET, SOCK_STREAM

def expect(dict_obj, key, value):
    try:
        assert dict_obj[key] == value
    except:
        raise ValueError(str(dict_obj) + "[" + str(key) + "] was not " + str(value))

class JsonDebugger(Bdb):
    def runfile(self, filename, jsonin, jsonout):
        self.jsonin = jsonin
        self.jsonout = jsonout
        self.last_break_line = None
        self.mainfilepath = self.canonic(filename)
        self.run("exec(open(%r).read())" % self.mainfilepath)

    def writejson(self, obj):
        self.jsonout.send((json.dumps(obj) + "\n").encode())

    def readjson(self):
        return json.loads(self.jsonin.readline())
    
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
            if self.last_break_line != line:
                self.last_break_line = line
                self.writejson({
                    "type": "break",
                    "linenumber": line
                })
                msg = self.readjson()
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

def main():
    parser = ArgumentParser(description="JSON debugger")
    parser.add_argument("--file", help="A path to the file to be debugged")
    args = parser.parse_args()
    
    serversocket = socket(AF_INET, SOCK_STREAM)
    serversocket.bind(("", 0))
    serversocket.listen(4)
    
    serveraddr = serversocket.getsockname()
    
    sys.stdout.write(json.dumps({
        "type": "serverinit",
        "host": serveraddr[0],
        "port": serveraddr[1]
    }) + "\n")
    sys.stdout.flush()
    response = sys.stdin.readline()
    expect(json.loads(response), "type", "clientinit")
    
    (clientsocket, address) = serversocket.accept()
    jsonin = clientsocket.makefile()
    jsonout = clientsocket
    JsonDebugger().runfile(args.file, jsonin, jsonout)
    jsonout.send((json.dumps({
        "type": "finish"
    }) + "\n").encode())

main()
