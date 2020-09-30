import pandas as pd
import time
import json
import pathlib
import os


def get_tmod(loc):

    path = pathlib.Path(loc)
    tmod = path.stat().st_mtime

    return tmod


def check_df(df):

    needs_rewrite = False

    # Check for subject id
    if 'subject_id' not in df:
        needs_rewrite = True

        subj_ids = ['participant_id', 'src_subject_id',
                    'subject', 'id', 'sbj', 'sbj_id',
                    'subjectkey', 'ID', 'UID', 'GUID']

        for s_id in subj_ids:
            if s_id in df:
                df = df.rename({s_id: 'subject_id'}, axis=1)
                break

    # If still not in data
    if 'subject_id' not in df:
        print('Warning no - valid subject data found, skipping this source')
        return pd.DataFrame(), False

    # Check for eventname
    if 'eventname' not in df:
        needs_rewrite = True

        event_ids = ['event', 'events', 'session_id', 'event name',
                     'session', 'time_point', 'event_name']

        for e_id in event_ids:
            if e_id in df:
                df = df.rename({e_id: 'eventname'}, axis=1)
                break

    # If still not in df - add as 'None'
    if 'eventname' not in df:
        df['eventname'] = 'None'

    return df, needs_rewrite


def load_col_names(file_loc):

    # Just just column names
    col_name_df = pd.read_csv(file_loc, nrows=0)

    # Apply checks
    col_name_df, needs_rewrite = check_df(col_name_df)

    # If needs re-write - re-write with new col-names
    if needs_rewrite:

        print('Rewriting header for', file_loc)
        df, _ = check_df(pd.read_csv(file_loc))
        df.to_csv(file_loc, index=False)

    # Drop subject and eventname cols
    col_name_df = col_name_df.drop(['subject_id', 'eventname'], axis=1)

    # Return col names as set
    return set(list(col_name_df))


def merge_dfs(existing, current):

    cols = list(current)
    merged = pd.merge(existing, current, how='outer',
                      on=['subject_id', 'eventname'])

    for col in cols:
        if col+'_x' in merged:
            merged[col+'_x'].update(merged[col+'_y'])
            merged = merged.rename({col+'_x': col}, axis=1)
            merged = merged.drop(col+'_y', axis=1)

    return merged


def load_vars(variables, col_to_loc, pop=False):

    # Load requested columns by each file seperately
    by_file = {}
    for v in variables:

        file = col_to_loc[v]

        try:
            by_file[file].append(v)
        except KeyError:
            by_file[file] = [v]

    # Create dfs for each file
    dfs = []
    for file in by_file:

        if pop:
            full_df = pd.read_csv(file)
            df = full_df[by_file[file] + ['subject_id', 'eventname']].copy()
            resave_df = full_df.drop(by_file[file], axis=1)
            resave_df.to_csv(file, index=False)
            print('Re-saving with popped cols removed, new shape:',
                  resave_df.shape)

        else:
            df = pd.read_csv(
                file, usecols=by_file[file] + ['subject_id', 'eventname'])

        df = df.set_index(['subject_id', 'eventname'])
        dfs.append(df)

    # Concat if needed
    if len(dfs) > 1:
        return pd.concat(dfs, axis=1).reset_index()
    else:
        return dfs[0].reset_index()


class Dataset():

    def __init__(self, base_loc, dataset_name):

        # In case of merged extras, add new to a new file
        # this is the max columns that file can have
        self.EXTRA_COL_LIM = 50

        # Save to class
        self.base_loc = base_loc
        self.dataset_name = dataset_name

        # Set dataset loc
        sources_loc = os.path.join(base_loc, 'sources')
        self.dataset_loc = os.path.join(sources_loc, dataset_name)

        # Make info loc is doesnt exist
        self.info_loc = os.path.join(base_loc, 'bpt/Data_Info/' + dataset_name)
        os.makedirs(self.info_loc, exist_ok=True)

        # Set shorthand loc
        self.lp_loc = os.path.join(self.info_loc, 'last_proc.txt')
        self.lf_loc = os.path.join(self.info_loc, 'loaded_files.json')

        # Init
        self.vars_to_loc = {}
        self.vars = []
        self.eventnames = []
        self.loaded_files = []

    def _get_file_locs(self):

        files = os.listdir(self.dataset_loc)
        file_locs = [os.path.join(self.dataset_loc, file) for file in files]
        return file_locs

    def _check_if_changed(self):
        '''Return True if something needs to be proced, False if skip'''

        file_locs = self._get_file_locs()

        # If no files, return True to signal delete
        if len(file_locs) == 0:
            return True

        # Check if last time proc'ed exists, load if it does
        if os.path.exists(self.lp_loc):
            with open(self.lp_loc, 'r') as f:
                self.last_proc = float(f.read())

            # Get the last time modified for all files
            times = [get_tmod(loc) for loc in file_locs]

            # If something has been changed since last proc, return True
            if max(times) - self.last_proc > 0:
                return True

            # Otherwise, check if anything deleted
            if os.path.exists(self.lf_loc):
                with open(self.lf_loc, 'r') as f:
                    self.loaded_files = set(json.load(f))

                if len(self.loaded_files - set(file_locs)) > 0:
                    return True

            # Otherwise, False, can skip
            return False

        # If it doesnt, return True, means this is the first time proc'ed
        self.last_proc = 0
        return True

    def _load_existing(self):

        # Try to load all if existing
        for to_load in ['vars_to_loc', 'eventnames', 'loaded_files']:
            loc = os.path.join(self.info_loc, to_load + '.json')

            if os.path.exists(loc):
                with open(loc, 'r') as f:
                    setattr(self, to_load, json.load(f))

        # Cast to sets
        self.eventnames = set(self.eventnames)
        self.loaded_files = set(self.loaded_files)

    def _delete_files(self, file_locs):
        '''File locs should be set'''

        if len(file_locs) == 0:
            return

        print('delete', file_locs)

        loaded = list(self.vars_to_loc)
        for v in loaded:
            if self.vars_to_loc[v] in file_locs:
                del self.vars_to_loc[v]

        # Remove from loaded files also
        for loc in file_locs:
            if loc in self.loaded_files:
                self.loaded_files.remove(loc)

    def process_files(self):

        # If changed
        if self._check_if_changed():

            # Try to load existing
            self._load_existing()

            # Proc files
            self._process_files()

            # Check for deleted files
            to_delete = self.loaded_files - set(self._get_file_locs())
            self._delete_files(to_delete)

            # Finish by saving
            self._save()

    def _process_files(self):

        # Process each file
        file_locs = self._get_file_locs()
        for file_loc in file_locs:

            # If changed or new - If unchanged, skip
            if get_tmod(file_loc) - self.last_proc > 0:

                # If file_loc in loaded_files, then means changed
                # Only difference between changed and new file is,
                # first delete file before adding
                if file_loc in self.loaded_files:
                    self._delete_files(set([file_loc]))

                # Add / proc file
                self._add_file(file_loc)

    def _add_file(self, file_loc):
        print('add file', file_loc)

        # Load first just the column names (with subject_id + eventname cols)
        col_names = load_col_names(file_loc)

        # Check for overlapping + new
        loaded_vars = set(self.vars_to_loc.keys())
        existing_vars = loaded_vars.intersection(col_names)
        new_vars = col_names - loaded_vars

        # Process existing vars
        self._add_existing_vars(existing_vars, file_loc)

        # Add new vars
        self._add_vars(new_vars, file_loc)

        # Process eventname
        self._proc_eventname(file_loc)

    def _get_extra_df_locs(self):
        '''Get the location of the last extra df'''

        def get_pth(cnt):
            return os.path.join(self.dataset_loc,
                                'OVERLAPPED' + str(cnt) + '.csv')

        cnt = 0
        while os.path.exists(get_pth(cnt)):
            cnt += 1

        return get_pth(cnt-1), get_pth(cnt)

    def _add_existing_vars(self, existing_vars, file_loc):

        if len(existing_vars) == 0:
            return

        new_df = pd.read_csv(file_loc,
                             usecols=list(existing_vars) + ['subject_id',
                                                            'eventname'])

        existing_df = load_vars(existing_vars, self.vars_to_loc, pop=True)
        merged_df = merge_dfs(existing_df, new_df)
        print('Merged overlapping columns with existing, new shape',
              merged_df.shape)

        # Get current extra df loc, and next loc
        extra_df_loc, next_df_loc = self._get_extra_df_locs()

        if os.path.exists(extra_df_loc):

            extra_df_len = len(pd.read_csv(extra_df_loc, nrows=0).columns)
            comb_len = extra_df_len + len(merged_df.columns)

            if comb_len < self.EXTRA_COL_LIM:

                combined_df = merged_df.merge(pd.read_csv(extra_df_loc),
                                              on=['subject_id', 'eventname'],
                                              how='outer')

                print(
                    'Adding merged overlapped columns to',
                    'existing OVERLAP file',
                    combined_df.shape)
                combined_df.to_csv(extra_df_loc, index=False)
                self._add_vars(existing_vars, extra_df_loc)

                # End if reaches here
                return

        # If not adding to an existing, i.e., early ended, add to new overlap
        print('Adding merged overlapped columns to new OVERLAP file',
              merged_df.shape)
        merged_df.to_csv(next_df_loc, index=False)
        self._add_vars(existing_vars, next_df_loc)

    def _add_vars(self, new_vars, file_loc):

        # Update vars to loc
        new_locs = {var: file_loc for var in new_vars}
        self.vars_to_loc.update(new_locs)

        # Add to loaded files
        self.loaded_files.add(file_loc)

    def _proc_eventname(self, file_loc):

        # Load unique eventnames
        events_df = pd.read_csv(file_loc, usecols=['eventname'])
        u_events = set(list(events_df['eventname'].unique()))

        # Union / update with existing eventnames
        self.eventnames.update(u_events)

    def _save(self):

        # Cast back to str
        self.eventnames = list(self.eventnames)
        self.loaded_files = list(self.loaded_files)

        # Also save a list-like with variables loaded
        self.loaded = list(self.vars_to_loc)

        for to_save in ['vars_to_loc', 'eventnames', 'loaded_files', 'loaded']:
            loc = os.path.join(self.info_loc, to_save + '.json')

            # Save new json
            with open(loc, 'w') as f:
                json.dump(getattr(self, to_save), f)

        # Write time of last changes
        with open(self.lp_loc, 'w') as f:
            f.write(str(time.time()))
