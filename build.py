"""
This code isn't pretty, but it allows me to modify the interface html/css without having to
deal with javascript string formatting
"""

import re

def insert_javascript(filename):
	with open(filename) as fp:
		return fp.read()

def insert_code(filename):
	with open(filename) as fp:
		code = fp.read()
	# get rid of whitespace characters except for spaces to fit on one line
	code = code.replace("'", "\\'").replace('"', '\\"')
	# strip newlines and tabs
	code = re.sub(r'[\t\n\r\f\v]', '', code)
	code = re.sub(r'\/\*.+?\*\/', '', code)
	return code


def main():
	javascript = insert_javascript('src/collect_base.js')
	codematch = re.compile(r'{{([a-zA-Z.\/]+)}}')
	for filename in re.findall(codematch, javascript):
		if filename[-3:] == ".js":
			javascript = javascript.replace('{{%s}}' % filename, insert_javascript(filename))
		else:
			javascript = javascript.replace('{{%s}}' % filename, insert_code(filename))
	with open('extension/collect.js', 'wb') as fp:
		fp.write(javascript)

if __name__=="__main__":
	main()
	