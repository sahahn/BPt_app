import argparse
from loading import variable_load
import pymonetdb




def main(user_dr, n):

    try:
        conn = pymonetdb.connect(username="monetdb", password="monetdb",
                            hostname="localhost", port=11223, database="abcd")
        with open('/tmp/hi', 'w') as f:
            f.write('worked')
    except:
        with open('/tmp/hi', 'w') as f:
            f.write('failed')


    variable_load(user_dr, 'target', n)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='ABCD_ML Load Target Script')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users directory to work '
                             'in')
    parser.add_argument('n', type=str,
                        help='')
    args = parser.parse_args()
    main(args.user_dr, args.n)
