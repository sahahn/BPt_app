import os
import json
from Dataset import Dataset


def process_dataset(base_loc, dataset_name):

    # Init dataset with locs, etc...
    dataset = Dataset(base_loc=base_loc,
                      dataset_name=dataset_name)

    # Process files (skips if not needed)
    dataset.process_files()


def process_datasets(base_loc):

    # Make data info if doesnt exist
    data_info_loc = os.path.join(base_loc, 'bpt/Data_Info')
    os.makedirs(data_info_loc, exist_ok=True)

    # Process each dataset
    sources_loc = os.path.join(base_loc, 'sources')
    datasets = os.listdir(sources_loc)
    for dataset in datasets:
        process_dataset(base_loc, dataset)

    # Save datasets.json w/ current datasets
    datasets_loc = os.path.join(base_loc, 'bpt/datasets.json')
    with open(datasets_loc, 'w') as f:
        json.dump(datasets, f)

    # Get and save all events across all datasets
    all_events = set()
    for dataset in datasets:
        event_file = os.path.join(data_info_loc, dataset, 'eventnames.json')
        with open(event_file, 'r') as f:
            all_events.update(set(json.load(f)))

    all_events_loc = os.path.join(base_loc, 'bpt/all_events.json')
    with open(all_events_loc, 'w') as f:
        json.dump(list(all_events), f)


def main():

    base_loc = '/var/www/html/data'

    # Locs + checks
    lock_loc = os.path.join(base_loc, 'bpt/lock')
    error_loc = os.path.join(base_loc, 'bpt/process_datasets_errors.txt')

    # Check for db-add lock
    if (os.path.isfile(lock_loc)):
        return None
    else:
        with open(lock_loc, 'w') as f:
            f.write('locked')

    # Call process datasets only if no
    try:
        process_datasets(base_loc)

    # If error, save to text file
    except Exception as e:
        with open(error_loc, 'w') as f:
            f.write(repr(e))

    # Remove the lock - regardless of if error or success
    os.remove(lock_loc)


if __name__ == "__main__":
    main()
