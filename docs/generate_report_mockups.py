import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import seaborn as sns
import os

# Ensure the output directory exists
output_dir = os.path.dirname(os.path.abspath(__file__))

# Set style for professional look
plt.style.use('ggplot')
sns.set_theme(style="whitegrid")

def create_pareto_chart():
    """Generates a Pareto Chart for Part Failures."""
    data = {
        'Part': ['Compressor Start Cap', 'Fan Motor 1/2HP', 'Contactor 24V', 'Thermostat WiFi', 
                 'Control Board V2', 'Igniter Assembly', 'Pressure Switch', 'Limit Switch'],
        'Failures': [145, 110, 85, 60, 45, 30, 20, 15]
    }
    df = pd.DataFrame(data)
    df['Cumulative Percentage'] = df['Failures'].cumsum() / df['Failures'].sum() * 100

    fig, ax1 = plt.subplots(figsize=(10, 6))

    # Bar chart
    sns.barplot(x='Part', y='Failures', data=df, color='steelblue', ax=ax1)
    ax1.set_ylabel('Failure Count', color='steelblue', fontsize=12)
    ax1.tick_params(axis='y', labelcolor='steelblue')
    ax1.set_xticklabels(df['Part'], rotation=45, ha='right')

    # Line chart on secondary axis
    ax2 = ax1.twinx()
    sns.lineplot(x=df.index, y='Cumulative Percentage', data=df, color='red', marker='o', ax=ax2, linewidth=2)
    ax2.set_ylabel('Cumulative %', color='red', fontsize=12)
    ax2.tick_params(axis='y', labelcolor='red')
    ax2.set_ylim(0, 110)

    plt.title('Part Failure Pareto Analysis (Top 20% Causes)', fontsize=16, pad=20)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'report_mockup_pareto.png'), dpi=150)
    plt.close()
    print("Generated Pareto Chart")

def create_mtbf_scatter():
    """Generates a Scatter Plot for Equipment MTBF."""
    np.random.seed(42)
    
    # Generate synthetic data
    n_points = 50
    equipment_types = ['AC Unit', 'Furnace', 'Heat Pump']
    
    data = {
        'Age (Years)': np.random.uniform(1, 15, n_points),
        'Failures per Year': np.random.uniform(0, 4, n_points),
        'Repair Cost': np.random.uniform(100, 2000, n_points),
        'Type': np.random.choice(equipment_types, n_points)
    }
    
    # Correlate failures with age slightly
    data['Failures per Year'] += data['Age (Years)'] * 0.1
    
    df = pd.DataFrame(data)

    plt.figure(figsize=(10, 6))
    
    # Scatter plot with size mapped to cost
    sns.scatterplot(
        data=df, 
        x='Age (Years)', 
        y='Failures per Year', 
        size='Repair Cost', 
        hue='Type', 
        sizes=(50, 400), 
        alpha=0.7,
        palette='viridis'
    )

    plt.title('Equipment MTBF & Cost Analysis', fontsize=16, pad=20)
    plt.xlabel('Equipment Age (Years)', fontsize=12)
    plt.ylabel('Avg. Failures / Year', fontsize=12)
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'report_mockup_mtbf.png'), dpi=150)
    plt.close()
    print("Generated MTBF Scatter Plot")

def create_rework_chart():
    """Generates a Horizontal Bar Chart for Rework Reasons."""
    data = {
        'Reason': ['Part Not on Truck', 'Incorrect Diagnosis', 'Insufficient Time', 
                   'Wrong Skillset', 'Customer Unavailable', 'Weather/Environment'],
        'Incidents': [45, 28, 15, 12, 8, 5]
    }
    df = pd.DataFrame(data)
    df = df.sort_values('Incidents', ascending=True)

    plt.figure(figsize=(10, 6))
    
    bars = plt.barh(df['Reason'], df['Incidents'], color='#e67e22')
    
    plt.xlabel('Number of Rework Incidents', fontsize=12)
    plt.title('Rework Root Cause Analysis (Why we return)', fontsize=16, pad=20)
    
    # Add value labels
    for bar in bars:
        width = bar.get_width()
        plt.text(width + 0.5, bar.get_y() + bar.get_height()/2, 
                 f'{int(width)}', va='center', fontsize=10)

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'report_mockup_rework.png'), dpi=150)
    plt.close()
    print("Generated Rework Chart")

def create_inventory_heatmap():
    """Generates a Heatmap for Inventory Aging."""
    # Create a matrix of data: Parts Categories vs Warehouses/Trucks
    categories = ['Compressors', 'Motors', 'Coils', 'Filters', 'Thermostats', 'Breakers']
    locations = ['Main Warehouse', 'Truck 101', 'Truck 102', 'Truck 104', 'Truck 105']
    
    # Values = Avg Days in Inventory (Randomized with some structure)
    data = [
        [45, 120, 150, 30, 60],   # Compressors (Stagnant in trucks)
        [30, 45, 60, 20, 25],     # Motors (Moving well)
        [90, 180, 200, 15, 45],   # Coils (Very stagnant in some trucks)
        [15, 10, 5, 12, 8],       # Filters (Fast moving)
        [60, 90, 30, 45, 20],     # Thermostats
        [120, 30, 45, 180, 60]    # Breakers
    ]
    
    df = pd.DataFrame(data, index=categories, columns=locations)

    plt.figure(figsize=(10, 6))
    
    # Heatmap
    sns.heatmap(df, annot=True, fmt="d", cmap="RdYlGn_r", cbar_kws={'label': 'Avg Days in Inventory'})
    
    plt.title('Inventory Aging Heatmap (Red = Stagnant > 90 Days)', fontsize=16, pad=20)
    plt.yticks(rotation=0)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'report_mockup_inventory.png'), dpi=150)
    plt.close()
    print("Generated Inventory Heatmap")

if __name__ == "__main__":
    print("Generating report mockups...")
    create_pareto_chart()
    create_mtbf_scatter()
    create_rework_chart()
    create_inventory_heatmap()
    print(f"All mockups saved to {output_dir}")
