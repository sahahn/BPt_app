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
    datasets = [f for f in os.listdir(sources_loc) if not f.startswith('.')]
    for dataset in datasets:
        process_dataset(base_loc, dataset)

    # Check each dataset for its events
    # Also check to make sure dataset isnt empty
    non_empty_datasets = []
    all_events = set()

    for dataset in datasets:
        event_file = os.path.join(data_info_loc, dataset, 'eventnames.json')
        with open(event_file, 'r') as f:
            events = set(json.load(f))
            all_events.update(events)

            # Only add dataset if atleast 1 event (only 0 events when empty)
            if len(events) > 0:
                non_empty_datasets.append(dataset)

    # Save overlapped events
    all_events_loc = os.path.join(base_loc, 'bpt/all_events.json')
    with open(all_events_loc, 'w') as f:
        json.dump(list(all_events), f)

    # Save datasets.json w/ non-empty datasets
    datasets_loc = os.path.join(base_loc, 'bpt/datasets.json')
    with open(datasets_loc, 'w') as f:
        json.dump(sorted(non_empty_datasets), f)


def main():

    base_loc = '/var/www/html/data'

    # Locs + checks
    lock_loc = os.path.join(base_loc, 'bpt/lock')
    ready_loc = os.path.join(base_loc, 'bpt/ready')
    error_loc = os.path.join(base_loc, 'bpt/process_datasets_errors.txt')

    # Check for db-add lock
    if (os.path.isfile(lock_loc)):
        return None
    else:
        with open(lock_loc, 'w') as f:
            f.write('locked')

    # If previous error file exists, remove it
    if os.path.exists(error_loc):
        os.remove(error_loc)

    # Call process datasets only if no
    try:
        process_datasets(base_loc)

        # If processed no errors add ready
        with open(ready_loc, 'w') as f:
            f.write('ready')

    # If error, save to text file
    except Exception as e:
        with open(error_loc, 'w') as f:
            f.write(repr(e))

    # Remove the lock - regardless of if error or success
    os.remove(lock_loc)


if __name__ == "__main__":
    main()
