"""
Copyright 2025 Amazon.com, Inc. and its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

  http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
"""

import boto3
import time
import os
import shutil
from config_loader import config, load_config
import argparse
import datetime


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="IoT Device Cleanup Utility")
    parser.add_argument(
        "--config",
        type=str,
        default="dev-config.yaml",
        help="Path to configuration file (default: dev-config.yaml)",
    )
    parser.add_argument(
        "--delete-groups",
        action="store_true",
        help="Delete thing groups (by default, groups are kept)",
    )
    parser.add_argument(
        "--delete-types",
        action="store_true",
        help="Delete thing types (by default, types are kept)",
    )
    parser.add_argument(
        "--keep-jobs",
        action="store_true",
        help="Keep IoT jobs (by default, jobs are deleted)",
    )
    return parser.parse_args()


def delete_retained_messages(iot_client):
    """
    Delete retained MQTT messages by publishing empty messages with retain flag
    """
    print(f"\n=== Cleaning up Retained MQTT Messages ===")

    try:
        # Get topic patterns from config
        retained_config = config.config.get("retained_messages", {})
        config_patterns = retained_config.get("topic_patterns", [])

        # Extract prefixes from config
        topic_patterns = []
        for pattern in config_patterns:
            prefix = pattern.get("prefix")
            if prefix:
                topic_patterns.append(prefix)

        # If no patterns found in config, use defaults
        if not topic_patterns:
            topic_patterns = [
                "device/+/state",
                "things/+/topics/meta",
                "things/+/topics/sensor",
                "things/+/topics/info",
            ]

        print(f"Using {len(topic_patterns)} topic patterns from config:")
        for pattern in topic_patterns:
            print(f"  - {pattern}")

        # We need to use the iot-data endpoint for MQTT operations
        # Get the endpoint
        endpoint = iot_client.describe_endpoint(endpointType="iot:Data-ATS")[
            "endpointAddress"
        ]

        # Create an IoT Data client
        iot_data_client = boto3.client(
            "iot-data",
            region_name=iot_client._client_config.region_name,
            endpoint_url=f"https://{endpoint}",
        )

        # Get all things to expand the wildcards in topic patterns
        print("Getting all things to expand topic patterns...")
        things = []
        paginator = iot_client.get_paginator("list_things")

        for page in paginator.paginate():
            for thing in page["things"]:
                things.append(thing["thingName"])

        if not things:
            print("No things found to expand topic patterns.")
            # Use some fixed topics without wildcards
            expanded_topics = [
                "device/state",
                "things/topics/meta",
                "things/topics/sensor",
                "things/topics/info",
            ]
            print(f"Using {len(expanded_topics)} fixed topics.")
        else:
            print(f"Found {len(things)} things to process for retained messages.")
            # Expand topic patterns with actual thing names
            expanded_topics = []
            for pattern in topic_patterns:
                if "+" in pattern:
                    for thing_name in things:
                        # Replace the '+' wildcard with the actual thing name
                        expanded_topic = pattern.replace("+", thing_name)
                        expanded_topics.append(expanded_topic)
                else:
                    # If no wildcard, use the pattern as is
                    expanded_topics.append(pattern)

            print(f"Expanded to {len(expanded_topics)} potential topics.")

        # Process each expanded topic
        success_count = 0
        failure_count = 0

        for topic in expanded_topics:
            print(f"\nProcessing topic: {topic}")

            try:
                # Publish empty message with retain flag to delete any retained message
                print(f"  Publishing empty message with retain flag to {topic}")

                # Try with QoS 1 which is commonly used for retained messages
                iot_data_client.publish(topic=topic, payload=b"", qos=1, retain=True)

                print(f"  Published empty message to {topic} with retain flag")
                success_count += 1

            except Exception as e:
                print(f"  Error publishing to {topic}: {str(e)}")
                failure_count += 1

        print(f"\nRetained message deletion summary:")
        print(f"  Successfully processed: {success_count} topics")
        print(f"  Failed: {failure_count} topics")

    except Exception as e:
        print(f"Error processing retained messages: {str(e)}")


def delete_thing_groups(iot_client):
    """
    Delete thing groups created by the device simulation
    """
    print("\n=== Cleaning up Thing Groups ===")

    try:
        # Get thing groups from config
        thing_groups_config = config.get_device_config().get("thing_groups", [])
        group_names = [
            group.get("name") for group in thing_groups_config if group.get("name")
        ]

        if not group_names:
            print("No thing groups defined in config.")
            return

        print(f"Found {len(group_names)} thing groups in config")

        # Process each thing group
        for group_name in group_names:
            print(f"\nProcessing thing group: {group_name}")

            try:
                # Get things in this group
                paginator = iot_client.get_paginator("list_things_in_thing_group")
                things_in_group = []

                for page in paginator.paginate(thingGroupName=group_name):
                    things_in_group.extend(page["things"])

                if things_in_group:
                    print(f"  Group contains {len(things_in_group)} things")

                    # Remove things from group without deleting them
                    # (things will be deleted separately)
                    for thing_name in things_in_group:
                        try:
                            iot_client.remove_thing_from_thing_group(
                                thingGroupName=group_name, thingName=thing_name
                            )
                            print(
                                f"  Removed thing {thing_name} from group {group_name}"
                            )
                        except Exception as e:
                            print(f"  Error removing thing from group: {str(e)}")

                # Delete the thing group
                iot_client.delete_thing_group(thingGroupName=group_name)
                print(f"  Deleted thing group: {group_name}")

            except iot_client.exceptions.ResourceNotFoundException:
                print(f"  Thing group {group_name} not found, skipping")
            except Exception as e:
                print(f"  Error processing thing group {group_name}: {str(e)}")

    except Exception as e:
        print(f"Error cleaning up thing groups: {str(e)}")


def delete_jobs(iot_client):
    """
    Delete all IoT jobs created by the device simulation
    """
    print("\n=== Cleaning up IoT Jobs ===")

    try:
        # List all jobs
        paginator = iot_client.get_paginator("list_jobs")
        jobs_to_delete = []

        # Look for firmware update jobs created by our simulation
        for page in paginator.paginate():
            for job in page["jobs"]:
                job_id = job["jobId"]
                # Check if this is one of our firmware update jobs
                if job_id.startswith("firmware-update-v"):
                    jobs_to_delete.append(job_id)

        if not jobs_to_delete:
            print("No firmware update jobs found.")
            return

        print(f"Found {len(jobs_to_delete)} firmware update jobs to delete")

        # Process each job
        for job_id in jobs_to_delete:
            print(f"\nProcessing job: {job_id}")

            try:
                # First try to cancel the job if it's not in a terminal state
                try:
                    iot_client.cancel_job(jobId=job_id, force=True)
                    print(f"  Cancelled job: {job_id}")
                    # Wait a moment for cancellation to take effect
                    time.sleep(1)
                except Exception as e:
                    # Job might already be in terminal state
                    print(f"  Note: Could not cancel job {job_id}: {str(e)}")

                # Now delete the job
                iot_client.delete_job(jobId=job_id, force=True)
                print(f"  Deleted job: {job_id}")

            except Exception as e:
                print(f"  Error deleting job {job_id}: {str(e)}")

    except Exception as e:
        print(f"Error cleaning up IoT jobs: {str(e)}")


def delete_thing_types(iot_client):
    """
    Delete thing types created by the device simulation
    """
    print("\n=== Cleaning up Thing Types ===")

    try:
        # Get thing types from config
        thing_types_config = config.get_device_config().get("thing_types", [])
        type_names = [
            thing_type.get("name")
            for thing_type in thing_types_config
            if thing_type.get("name")
        ]

        if not type_names:
            print("No thing types defined in config.")
            return

        print(f"Found {len(type_names)} thing types in config")

        # Process each thing type
        for type_name in type_names:
            print(f"\nProcessing thing type: {type_name}")

            try:
                # Check if the thing type exists
                try:
                    thing_type_info = iot_client.describe_thing_type(
                        thingTypeName=type_name
                    )
                    is_deprecated = thing_type_info.get("thingTypeMetadata", {}).get(
                        "deprecated", False
                    )

                    if not is_deprecated:
                        # Deprecate the thing type first
                        iot_client.deprecate_thing_type(thingTypeName=type_name)
                        print(f"  Deprecated thing type: {type_name}")
                        print(
                            f"  NOTE: AWS requires a 5-minute waiting period after deprecation before deletion."
                        )
                        print(
                            f"  The thing type will need to be deleted in a future cleanup run."
                        )
                    else:
                        # If already deprecated, try to delete it
                        try:
                            iot_client.delete_thing_type(thingTypeName=type_name)
                            print(f"  Deleted thing type: {type_name}")
                        except iot_client.exceptions.InvalidRequestException as e:
                            if "Please wait for 5 minutes after deprecation" in str(e):
                                print(f"  Cannot delete thing type yet: {type_name}")
                                print(
                                    f"  AWS requires a 5-minute waiting period after deprecation."
                                )
                                print(
                                    f"  The thing type will need to be deleted in a future cleanup run."
                                )
                            else:
                                print(f"  Error deleting thing type: {str(e)}")
                except iot_client.exceptions.ResourceNotFoundException:
                    print(f"  Thing type {type_name} not found, skipping")

            except Exception as e:
                print(f"  Error processing thing type {type_name}: {str(e)}")

    except Exception as e:
        print(f"Error cleaning up thing types: {str(e)}")


def cleanup_iot_entities(thing_prefix=None, policy_prefix=None, certs_base_path=None):
    """
    Cleanup all IoT entities (things, certificates, policies), local certificates,
    and device registry
    """
    iot_client = boto3.client("iot")
    region = boto3.session.Session().region_name
    account_id = boto3.client("sts").get_caller_identity().get("Account")

    print(f"Starting cleanup in region {region} for account {account_id}")

    try:
        # Step 1: Find all things with our prefix
        print("\n=== Cleaning up Things and attached Certificates ===")
        things_to_delete = []
        certificates_to_delete = set()

        paginator = iot_client.get_paginator("list_things")
        for page in paginator.paginate():
            for thing in page["things"]:
                if thing["thingName"].startswith(thing_prefix):
                    things_to_delete.append(thing["thingName"])

        print(f"Found {len(things_to_delete)} things to delete")

        # Step 2: For each thing, detach and collect certificates
        for thing_name in things_to_delete:
            print(f"\nProcessing thing: {thing_name}")

            try:
                # Get certificates attached to this thing
                principals = iot_client.list_thing_principals(thingName=thing_name)

                # Detach each certificate from the thing
                for principal in principals["principals"]:
                    cert_id = principal.split("/")[-1]
                    certificates_to_delete.add((cert_id, principal))

                    try:
                        iot_client.detach_thing_principal(
                            thingName=thing_name, principal=principal
                        )
                        print(
                            f"  Detached certificate {cert_id} from thing {thing_name}"
                        )
                    except Exception as e:
                        print(f"  Error detaching certificate from thing: {str(e)}")

                # Delete the thing
                try:
                    iot_client.delete_thing(thingName=thing_name)
                    print(f"  Deleted thing: {thing_name}")
                except Exception as e:
                    print(f"  Error deleting thing: {str(e)}")

            except Exception as e:
                print(f"Error processing thing {thing_name}: {str(e)}")

        # Step 3: Find all policies with our prefix
        print("\n=== Cleaning up Policies ===")
        policies = iot_client.list_policies()
        policy_names = [
            policy["policyName"]
            for policy in policies["policies"]
            if policy["policyName"].startswith(policy_prefix)
        ]

        print(f"Found {len(policy_names)} policies to delete")

        # Step 4: For each certificate, detach policies and delete certificate
        print("\n=== Cleaning up Certificates ===")
        print(f"Processing {len(certificates_to_delete)} certificates")

        for cert_id, cert_arn in certificates_to_delete:
            print(f"\nProcessing certificate: {cert_id}")

            # Find and detach policies from this certificate
            try:
                attached_policies = iot_client.list_attached_policies(target=cert_arn)

                for policy in attached_policies["policies"]:
                    try:
                        iot_client.detach_policy(
                            policyName=policy["policyName"], target=cert_arn
                        )
                        print(
                            f"  Detached policy {policy['policyName']} from certificate"
                        )
                    except Exception as e:
                        print(f"  Error detaching policy from certificate: {str(e)}")

                # Deactivate and delete the certificate
                try:
                    iot_client.update_certificate(
                        certificateId=cert_id, newStatus="INACTIVE"
                    )
                    time.sleep(1)  # Wait for deactivation
                    iot_client.delete_certificate(
                        certificateId=cert_id, forceDelete=True
                    )
                    print(f"  Deleted certificate: {cert_id}")
                except Exception as e:
                    print(f"  Error deleting certificate: {str(e)}")

            except Exception as e:
                print(f"Error processing certificate {cert_id}: {str(e)}")

        # Step 5: Delete policies
        print("\n=== Deleting Policies ===")
        for policy_name in policy_names:
            try:
                iot_client.delete_policy(policyName=policy_name)
                print(f"Deleted policy: {policy_name}")
            except Exception as e:
                print(f"Error deleting policy {policy_name}: {str(e)}")

        # Step 6: Clean up device shadows
        print("\n=== Cleaning up Device Shadows ===")
        try:
            # Get the IoT data endpoint for shadow operations
            endpoint = iot_client.describe_endpoint(endpointType="iot:Data-ATS")["endpointAddress"]
            
            # Create an IoT Data client for shadow operations
            iot_data_client = boto3.client(
                "iot-data",
                region_name=iot_client._client_config.region_name,
                endpoint_url=f"https://{endpoint}",
            )
            
            for thing_name in things_to_delete:
                try:
                    # Delete shadow using the iot-data client
                    iot_data_client.delete_thing_shadow(
                        thingName=thing_name, shadowName="classic"
                    )
                    print(f"Deleted shadow for thing: {thing_name}")
                except Exception as e:
                    # Shadow might not exist, which is fine
                    print(f"Note: Could not delete shadow for {thing_name}: {str(e)}")
        except Exception as e:
            print(f"Error setting up IoT data client for shadow operations: {str(e)}")

        # Step 7: Clean up local certificates
        print("\n=== Cleaning up Local Certificate Files ===")
        if os.path.exists(certs_base_path):
            try:
                shutil.rmtree(certs_base_path)
                print(f"Deleted local certificates directory: {certs_base_path}")
            except Exception as e:
                print(f"Error deleting local certificates: {str(e)}")

        # Step 8: Clean up device registry
        print("\n=== Cleaning up Device Registry ===")
        registry_file = "device_registry.json"
        if os.path.exists(registry_file):
            try:
                os.remove(registry_file)
                print(f"Deleted device registry file: {registry_file}")
            except Exception as e:
                print(f"Error deleting device registry file: {str(e)}")

        # Step 9: Check for any retained MQTT messages
        print("\n=== Cleanup completed ===")
        print(
            "Note: Any retained MQTT messages will expire according to AWS IoT message retention policy"
        )
        print(
            "      If you need to immediately clear retained messages, use the AWS IoT console or API"
        )

    except Exception as e:
        print(f"Error during cleanup: {str(e)}")


if __name__ == "__main__":
    # Parse command line arguments
    args = parse_arguments()

    # Load configuration from specified file
    if args.config != "dev-config.yaml":
        load_config(args.config)

    # Get configuration values
    device_config = config.get_device_config()
    thing_prefix = (
        device_config.get("identification", {})
        .get("device_id", {})
        .get("prefix", "iot_")
    )
    policy_prefix = f"device_policy_"
    certs_base_path = device_config.get("certs_base_path", "./certs")

    print(f"Starting cleanup with the following parameters:")
    print(f"  Thing prefix: {thing_prefix}")
    print(f"  Policy prefix: {policy_prefix}")
    print(f"  Certificates path: {certs_base_path}")

    # Create IoT client
    iot_client = boto3.client("iot")

    # First, clean up retained messages
    print("\nStep 1: Cleaning up retained MQTT messages")
    delete_retained_messages(iot_client)

    # Clean up IoT jobs
    print("\nStep 2: Cleaning up IoT jobs")
    delete_jobs(iot_client)

    # Next, clean up thing groups (before deleting things) only if explicitly requested
    print("\nStep 3: Processing thing groups")
    if args.delete_groups:
        delete_thing_groups(iot_client)
    else:
        print("Skipping thing group deletion (use --delete-groups flag to delete them)")

    # Then, clean up things, certificates, policies, etc.
    print("\nStep 4: Cleaning up things, certificates, and policies")
    cleanup_iot_entities(thing_prefix, policy_prefix, certs_base_path)

    # Process thing types only if explicitly requested
    print("\nStep 5: Processing thing types")
    if args.delete_types:
        delete_thing_types(iot_client)
    else:
        print("Skipping thing type deletion (use --delete-types flag to delete them)")

    print("\n=== Full cleanup completed ===")
