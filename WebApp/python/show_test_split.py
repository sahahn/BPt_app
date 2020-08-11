import argparse
import os
from utils import save_error
from loading import load_params, save_results
from load_test_split import base_test_load
import matplotlib.pyplot as plt
import numpy as np


def df_to_table(display_df):

    if display_df is None:
        return ''

    display_df = display_df[0].reset_index()

    table = '<table id="default-table-id" class="table table-striped">' + \
        '<thead><tr>'

    for col in display_df:
        table += '<th scope="col">' + str(col) + '</th>'

    table += '</tr></thead><tbody>'

    for row in display_df.index:
        table += '<tr>'
        for entry in display_df.loc[row]:

            if isinstance(entry, float):
                entry = np.round(entry, 3)
            table += '<td>' + str(entry) + '</td>'

        table += '</tr>'

    table += '</tbody></table>'
    return table


def main(user_dr, n):

    temp_dr = os.path.join(user_dr, 'temp')
    output_loc = os.path.join(temp_dr, 'ML_Output_' + str(n) + '.json')

    # Load in params
    params = load_params(user_dr, output_loc, n)

    # Base apply test
    ML = base_test_load(params, user_dr, output_loc, n)

    show_params = params['show_params']
    save_loc = os.path.join(user_dr, 'temp_dist'+str(n)+'.png')

    if show_params['source'] in ['Data Variable', 'Set Variable']:

        display_df = ML.Show_Covars_Dist(covars=show_params['name'],
                                         subjects='both',
                                         show=False, cat_type='Frequency',
                                         return_display_dfs=True)

    elif show_params['source'] == 'Target':

        display_df = ML.Show_Targets_Dist(targets=show_params['name'],
                                          subjects='both',
                                          show=False, cat_type='Frequency',
                                          return_display_dfs=True)

    elif show_params['source'] == 'Non-Input Variable':

        try:
            to_dist = show_params['name'].replace(ML.strat_u_name, '')
            display_df = ML.Show_Strat_Dist(strat=to_dist,
                                            subjects='both',
                                            show=False, cat_type='Frequency',
                                            return_display_dfs=True)

        except Exception as e:
            save_error('Error creating non-input dist', output_loc, e)

    elif show_params['source'] == 'Set':

        try:

            ML._print(show_params['name'], type(show_params['name']))

            display_df = None
            ML.notebook = True
            anim = ML.Show_Data_Dist(data_subset=show_params['name'],
                                     subjects='both',
                                     return_anim=True)
            ML.notebook = False

            import matplotlib.animation as animation
            Writer = animation.writers['ffmpeg']
            writer = Writer(fps=2)
            save_loc = save_loc.replace('.png', '.mp4')
            anim.save(save_loc.replace('.png', '.mp4'),
                      dpi=ML.dpi, writer=writer)

            output = {}
            output['html_output'] = ''
            output['html_table'] = ''
            output['img_loc'] = save_loc
            output['status'] = 1
            save_results(output_loc, output)
            return

        except Exception as e:
            save_error('Error creating distribution video', output_loc, e)

    plt.savefig(save_loc, dpi=ML.dpi, bbox_inches='tight')

    table = df_to_table(display_df)

    # 'Set'
    # 'Non-Input Variable'
    # 'Target'

    output = {}
    output['html_output'] = ''
    output['html_table'] = table
    output['img_loc'] = save_loc
    output['status'] = 1

    # Save results
    save_results(output_loc, output)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description='BPt Show Test Script')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users'
                             'directory to work in')
    parser.add_argument('n', type=str,
                        help='')
    args = parser.parse_args()
    main(args.user_dr, args.n)
